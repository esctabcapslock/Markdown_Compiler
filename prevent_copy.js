
function prevent_copy(str) {
    let style = ''

    function dk(str) {
        return str.split('').map(v=>'\\'+Number(v.charCodeAt(0)).toString(16)).join('')
    }


    let cnt = 0;
    function add_style(txt) {
        style += `#dc${cnt}::after{content:"${dk(txt)}";}`
        return cnt++
    }

    txt = str.split(/\<.*?\>/g)
    tag = str.match(/\<(.*?)\>/g)

    out = ''
    i = 0;
    for (; i < tag.length; i++) {
        if(tag[i-1]&&['<style','<head', '<title', '<script'].includes(tag[i-1].split(' '))) continue;
        if (txt[i].trim()) out += `<span class='txt' id="dc${add_style(txt[i])}"></span>`
        out += tag[i]
    } if (txt[i].trim()) out += `<span class='txt' id="dc${add_style(txt[i])}"></span>`
    
    out+=`<style>${style}</style>`
    return out;
}


module.exports.prevent_copy = prevent_copy

//document.body.innerHTML = prevent(document.body.innerHTML)