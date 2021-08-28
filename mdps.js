const hljs = require('highlight.js');
const fs = require('fs')
const argvs = process.argv.slice(2);

// var input = fs.readFileSync('./example.md').toString()
// var input = fs.readFileSync('./exm2.md').toString()
// var input = fs.readFileSync('./main.md').toString()
var input = fs.readFileSync(argvs[0]).toString()
var style = fs.readFileSync('./style.css').toString()
var add_style = fs.readFileSync('./add_style.css').toString()
var highlight_style = fs.readFileSync('./node_modules/highlight.js/styles/github.css').toString()

console.log('[argv]',argvs);


let out=''
let title=''
let tag = []
const footnote = {}
const footnote_view = []
let contents = ''
let deep = 1
function change_deep(d, txt){
    const dd = d//Math.max(2, d)

    if(dd==deep){
        1;//contents+= `<li><a href="s${contents_index.join('.')}">${txt}</a></li>`
    }
    else if(dd>deep) new Array(d-deep).fill().forEach(v=>contents+='<ul>\n')
    else if(dd<deep) new Array(deep-d).fill().forEach(v=>contents+='</ul>\n')
    deep = dd;

    if(d>=2) contents+= `<li><a href="#s${contents_index.join('.')}">${contents_index.slice().splice(1).join('.')}.</a> ${txt}</a></li>\n`
    else contents += `<b><a href="#s${contents_index.join('.')}">${txt}</a></b>\n`
}
let contents_index = []

function add_contents(cnt, txt){
    
    let deep = cnt-1;
    
    //console.log('[contents_index]',contents_index)
    if(contents_index[deep]!=undefined) contents_index[deep]++;
    while(contents_index[deep]==undefined) contents_index.push(1)
    while(contents_index.length > cnt) contents_index.pop()
    // /console.log('[contents_index]',contents_index)

    let a = ''
    if(deep) a=`<a href='#contents'>${contents_index.slice().splice(1).join('.')}.</a>`
    out+=`<h${cnt} id="s${contents_index.join('.')}"> ${a} ${txt}</h${cnt}>\n`
    change_deep(cnt, txt)
}

Object.defineProperties(Array.prototype, {
    count: {
        value: function(value) {
            return this.filter(x => x==value).length;
        }
    }
});

function add_notes(txt){
    id = txt.match(/\[\^\s*.*?\s*\]\:/g)[0].replace(/\[\^\s*(.*?)\s*\]\:/g, '$1')
    txt = txt.substr(txt.indexOf(':')+1).trim()
    //console.log('[add_notes]', id, txt)
    footnote[id]=txt
}

function get_notes(id, ind){
    id = id.trim().replace(/\[\^\s*(.*?)\s*\]/g, '$1')
    if(!(id in footnote)) return `[^${id}]`
    let cnt = footnote_view.count(id)
    footnote_view.push(id);
    return `<sup class="footnote-ref"><a href="#fn${id}" id="fnref${id}:${cnt}" title="${footnote[id]}">[${ind+1}]</a></sup>`
}

let b = input.replace(/\r/g,'').split('\n')

function zip_css(str){
    return str.replace(/\/\*(.*?)\*\//g,'')
        .replace(/\s+/g,' ')
        .replace(/\n/g, ' ')
}

function get_tg_name(str){
    //console.log('get_tg_name',str)
    if (Array.isArray(str)) return str.map(v=>get_tg_name(v));

    if(!str) return undefined;
    return str.trim('').split(' ')[0]
}

function spread_list(arr){
    let out = []
    arr.forEach(v=>Array.isArray(v)?out=[...out, ...v]:out.push(v))
    return out;
}

function list_push(arr,vv){
    arr.push(vv)
    //vv.map(v=>arr.push(v));
    return arr;
}

function copy(arr){
    if(arr==undefined) return undefined;
    //console.log('[copy]',arr)
    return JSON.parse(JSON.stringify(arr))
}


function list_top_push(arr,vv){
    arr=JSON.parse(JSON.stringify(arr))
    //console.log('[list_top_push]', arr, arr.length, tag, arr==tag)
    if(!arr.length) arr.push(vv)
    else vv.forEach(vvv=>arr[arr.length-1].push(vvv))
    //console.log('[list_top_push]', arr, tag, arr==tag)

    return arr;
}

function change_tag(new_tag){
    //console.log('[1>change_tag]', tag, new_tag, tag==new_tag)
    const _tag = spread_list(tag)
    const _new_tag = spread_list(new_tag)

    if (_tag != _new_tag){
        //console.log('[2>change_tag]', _tag, _new_tag, _tag== _new_tag)
        const queue = []
        let diff = true
        for(let i=Math.max(_tag.length, _new_tag.length)-1; i>=0; i--){
            if(diff && _tag[i]!=get_tg_name(_new_tag[i])){
                if(_tag[i]) out += `</${_tag[i]}>\n`
                if (_new_tag[i]) queue.push(_new_tag[i])
            }
            else diff = false
        }

        //console.log('[queue]',queue)

        while(queue.length){
            let dd = queue.pop()
            //console.log(dd)
            if(dd) out+=`<${dd}>\n`
        }
        tag = new_tag.map(v=>get_tg_name(v))
    }
}

function get_tag_top(){
    const top = tag[tag.length-1]
    if(Array.isArray(top)) return top[top.length-1]
    else return top;
}
function remove_list_top(arr){
    const top = arr.pop()
    top.pop()
    if((Array.isArray(top)&&top.length)) arr.push(top)
    else if(top) arr.push(top)
    return arr;
}

function get_tag_list_top(){
    const top = copy(tag[tag.length-1])
    if(top) return top;
    else return []
}

function list_top_change(arr, v){
    arr[arr.length-1] = v;
    return arr;
}

function html(text){
    if (RegExp(/^\[(.*?)\]\:/g).test(text.trim())){
        add_notes(text.trim())
        return ''
    }
    // \[\] 해결해야함.
    return text
        .replace(/<!--(.*?)-->/g,'')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\\\[/g,'[')
        .replace(/\\\]/g,']')
        .replace(/\\\./g,'.')
        .replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>')
        .replace(/\*(.*?)\*/g,'<em>$1</em>')
        .replace(/\~\~(.*?)\~\~/g,'<s>$1</s>')
        .replace(/\`\`\`(.*?)\`\`\`/g,'<code>$1</code>')
        .replace(/\`(.*?)\`/g,'<code>$1</code>')
        .replace(/\!\[(.*?)\]\s*\((.*?)\)/g,'<img src="$2" alt="$1"></img>')
        .replace(/\[(.*?)\]\s*\((.*?)\)/g,'<a href="$2">$1</a>')
        .replace(/&lt;(\s*[a-zA-Z].*?)&gt;/g,'<$1>')
        .replace(/&lt;\/(\s*[a-zA-Z].*?)&gt;/g,'</$1>')

//    .replace(/\[\^\s*(.*?)\s*\]/g,'<sup class="footnote-ref"><a href="#fn$1" id="fnref$1">[$1]</a></sup>')
        //
        // .replace(/\\\(/g,'(')
        // .replace(/\\\)/g,')')
}


function line2html(line, pre_tags){
    let ii = line.trim().split(' ')
    let art = ii[0].trim()
    //console.log('[line]', line, '[art]',art)
    //console.log('[pre_tags]', pre_tags,'[tag]',tag)

    if(!ii.length || !line.trim()){
        //console.log('nono', tag, line)
        let new_tag = copy(tag)
        if(['p', 'li'].includes(get_tag_top())) new_tag = remove_list_top(new_tag)
        if(pre_tags.length < tag.length) if(['ul|li','blockquote', 'blockquote|p',].includes(get_tag_list_top().join('|'))) new_tag.pop()

        //console.log('[nono=new_tag]',new_tag)
        change_tag(new_tag)
        return;
    }else if(line.startsWith('  ')||line.startsWith('\t')){
        //console.log('텝텝ㄴ')

        if(line.startsWith('  ')) line = line.substr( Math.min(6, line.indexOf(line.trim()[0])))
        else line = line.substr(1)

        //console.log('[\\t]',tag)
        
        if(pre_tags.length < tag.length)
            if(['ul','ol', 'li'].includes(get_tag_top()) || [ 'ul|li|p','ol|li|p','ul|li', 'ol|li','pre|code','blockquote|p', 'ol|li|p'].includes(get_tag_list_top().join('|'))){ //구조를 위해 들여쓰기 된 것.
                pre_tags = copy(tag).splice(0, pre_tags.length+1)// [...tag, ...pre_tags]
                line2html(line, pre_tags)
                return;

            }
        
        //코드를 위해 들여쓰기
        change_tag(list_push(pre_tags, ['pre','code']));
        out+=`${html(line)}\n`
    
            
    }
    else if(art.split('').every(v=>v=='#')) {
        change_tag(pre_tags)
        const len = art.length;
        //console.log(`h${len}`)
        //console.log(len,b[i], '[ii]', ii, !ii.length)
        ii.splice(0,1);
        const iii = ii.join(' ');
        const html_iii = html(iii)

        add_contents(len, html_iii)
        //out+=`<h${len}>${hmtl_iii}</h${len}>\n`
        //table_of_Contents.push(hmtl_iii)

        if(len==1 && !title) title = iii.trim()

    }else if(['*','-','+'].includes(art)){
        //if(['li'].includes(pre_tags[pre_tags.length-1]))

        change_tag(list_push(pre_tags, ['ul']))
        change_tag(list_top_change(pre_tags, ['ul', 'li']))
        change_tag(list_top_change(pre_tags, ['ul', 'li', 'p']))
        ii.splice(0,1);
        let iii = ii.join(' ');
        out+=`\t${html(iii)}\n`
    }else if(art.endsWith('.') && Number.isInteger(Number(art.substr(0,art.length-1)))){
        let n = Number(art.substr(0,art.length-1))

        change_tag(list_push(pre_tags, [`ol start="${n}"`]))
        change_tag(list_top_change(pre_tags, [`ol start="${n}"`, 'li']));
        change_tag(list_top_change(pre_tags, [`ol start="${n}"`, 'li', 'p']));
        
        ii.splice(0,1);
        let iii = ii.join(' ');
        out+=`\t${html(iii)}\n`
    }
    else if(art[0]=='>'){

        let cnt;
        let kk = line.trim()
        for(cnt=0; cnt<kk.length && kk[cnt]=='>'; cnt++);
        //console.log('[>>]', cnt)

        for(let i=0; i<cnt; i++) list_push(pre_tags, ['blockquote', 'p'])
        change_tag(pre_tags)
        
        //ii.splice(0,1);
        //let iii = ii.join(' ');
        //let iii = line.substr(line.indexOf('>')+1)
        let iii = kk.substr(cnt)
        line2html(iii, pre_tags)
        // console.log('[]>>>>>]',iii, '->',html(iii))
        // out+=`${html(iii)}\n`   
    }else if(['-','*'].includes([...new Set(line)].join('').trim()) && line.replace(/\s/g,'').length>=3){
        out+='<hr>'
    }
    else{
        //if(['ol','ul'].includes(get_tag_top())) change_tag(list_push(pre_tags, ['li']))
        //pre_tags = pre_tags.slice()
        //console.log('[1else]', pre_tags, tag, pre_tags==tag)
        if(!['p'].includes(get_tag_top())) {
            //console.log('[2else]', pre_tags, tag, pre_tags==tag)
            let tttmp = list_top_push(pre_tags, ['p'])
            //console.log('[3else]', pre_tags, tag, tttmp, pre_tags==tag, tttmp==tag, tttmp==pre_tags)
            change_tag(tttmp)
        }
        //console.log('[4else]', pre_tags, tag, pre_tags==tag)
        let iii = ii.join(' ');
        out+=`\t${html(iii)}\n`   

    }
}

function table2html(arr){
    if (arr.length<=2) return arr.join(' ')

    function ttrim(str){
        str = str.trim()
        if(str[0]=='|') str=str.substr(1)
        if(str[str.length-1]=='|') str=str.substr(0, str.length-1)
        return str.split('|')
    }

    let out='<table>'
    let thead = ttrim(arr[0])
    let align = ttrim(arr[1]).map(v=>v.trim())
    //console.log('[algin',align)
    align = thead.map((v,i)=>{
        if(align[i]){
            switch(align[i].endsWith(':')*2+ align[i].startsWith(':')){
                case 3: return 'center'
                case 2: return 'right'
                case 1: return 'left'
                case 0: return null
            }
        }else return null
    })
    //console.log('[algin',algin)

    out+=`<thead><tr>${
        thead.map((v,i)=>`<th ${align[i]?`style="text-align:${align[i]};"`:''}>${v}</th>`).join('\n')
    }</tr></thead>\n`

    out+='<tbody>'
    for(var i=2; i<arr.length; i++){
        let body = ttrim(arr[i]).map(v=>v.trim())
        body = thead.map((v,i)=> body[i]?body[i]:'')
        out+=`<tr>${body.map((v,i)=>`<td ${align[i]?`style="text-align:${align[i]};"`:''}>${v}</td>`).join('\n')}</tr>`
    }
    out+='</tbody>'
    out+='</table>'

    return out;
    
}

function code2html(arr, len){
    const html = hljs[len?'highlight':'highlightAuto'](arr.join('\n'), {language: len}).value
    
    //console.log('[code2html] arr',arr, '[language]', len, html)
    return  `<pre><code class="${len?`language-${len.trim()}`:''}"><div>${html}</div></code></pre>`
}

let table_html = []
let code_html = []
for (let i=0; i<b.length; i++){
    let line = b[i]

    //테이블 확인!
    if(line.includes('|') &&
        b[i+1] &&
        b[i+1].includes('|') &&
        b[i+1].trim()!='|' &&
        b[i+1].split('|').every((v,i,ar)=>((i==0||i==ar.length-1)&&!v.trim()) || ['-:','-'].includes([...new Set(v.trim().split(''))].sort().join('')))
    ){
        table_html = [line];
        i++;

        while(b[i].includes('|')){
            table_html.push(b[i])
            i++
        }
        line = line.substr(0,line.indexOf(line.trim()[0])) + table2html(table_html)
        //console.log('[table_html]',table_html, line)
    }
    else if(line.trim().startsWith('```')){ //코드 확인
        code_html = []
        language = line.trim().substr(3).trim()
        i++;
        while(b[i]!=undefined && b[i].trim() != '```'){
            //console.log('235')
            code_html.push(b[i]);
            i++;
        }

        line = line.substr(0,line.indexOf(line.trim()[0])) +  code2html(code_html, language)
        console.log('[table_html]',code_html, line)
    }
    // else if(line.trim() && b[i+1] && b[i+1].trim().split('').every(v=>v=='=')){
    //     line=`# ${line.trim()}`
    //     i++
    // }
    // else if(line.trim() && b[i+1] && b[i+1].trim().split('').every(v=>v=='-')){
    //     line=`## ${line.trim()}`
    //     i++
    // }
    
    line2html(line, [])
    //console.log(b[i].substr(50), ii) 

    //console.log('')
}
change_tag([]);

// 주석처리



const rest = out.split(/\[\^\s*.*?\s*\]/g)
let notes = out.match(/\[\^\s*.*?\s*\]/g)//
if(notes){
    notes = notes.map(v=>v.trim().replace(/\[\^\s*(.*?)\s*\]/g, '$1'))

    const note_id = []
    notes.forEach(v=>{if(!note_id.includes(v)) note_id.push(v)})
    console.log(note_id,'note_id')

    //console.log('[notes]', notes, rest.length, note_id)

    let html='';
    let i=0;
    for(; i<notes.length; i++){
        html+=rest[i]
        html+=get_notes(notes[i], note_id.indexOf(notes[i]))
    }html+=rest[i]
    console.log(i)

    out=html

    
console.log('[footnote]',footnote, '[footnote_view', footnote_view)
    if(footnote_view.length){
        out+='<hr>\n <ol>'

        
        note_id.map((id, ind)=>{
            id = note_id[ind]
            let cnt = footnote_view.count(id)
            //console.log(id, cnt)
            if(!cnt) return;
            else if(cnt==1) out+=`<li id="fn${ind+1}">${footnote[id]} <a href="#fnref${ind+1}:0">↩︎</a></li>`
            else {
                //console.log(id, cnt)
                out+=`<li id="fn${ind+1}"> ${footnote[id]}`
                for(let i=0; i<cnt; i++) 
                    out+=`<a href="#fnref${ind+1}:${i}">↩︎</a> `
                out+=`</li>`
            }
        })
        out+='</ol>'
    }
}


//<a href="#fn1" id="fnref1">[1]</a>

//console.log('[contents]',contents)

out=`<div id='contents'>
<h2>목차</h2>
    ${contents}
</div>
`+out;

// const prevent_copy = require('./prevent_copy').prevent_copy;
// const { argv } = require('process');
// //console.log('[prevent_copy]',prevent_copy)
// out=prevent_copy(out)

out=`<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        ${highlight_style}
        ${zip_css(add_style)}
        ${zip_css(style)}
    </style>
    <title>${title}</title>
    <script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
</head>
<body>
`+out

out+='</body>\n</html>\n'


//print(out)
fs.writeFile('tmp.html',out, err=>{
    if(err) console.log(err)
})