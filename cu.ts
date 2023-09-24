import { load } from 'cheerio'
import { writeFileSync } from 'fs'
const url = 'https://tabelog.com/rstLst'
let ratio = {}
let plist = {
    all: {},
    card: {}
}

Promise.all([
    fetch(url).then((data) => data.text()).then(async (text) => {
        let $ = load(text);
        if(ratio['全国']) {
            ratio['全国'].all = $('.c-page-count>.c-page-count__num:last-of-type>strong').text()
        } else {
            ratio['全国'] = {all: $('.c-page-count>.c-page-count__num:last-of-type>strong').text()}
        }
        $('.list-balloon__table--pref>dd>ul>li>a').each((index, element) => {
            let pre = element.children[0].data.trim();
            plist.all[pre] = element.attribs.href
        })
        await Promise.all(
            Object.keys(plist.all).map(pref => {
                return fetch(plist.all[pref]).then((data) => data.text()).then((text) => {
                    let $ = load(text)
                    if(ratio[pref]) {
                        ratio[pref].all = $('.c-page-count>.c-page-count__num:last-of-type>strong').text()
                    } else {
                        ratio[pref] = {all: $('.c-page-count>.c-page-count__num:last-of-type>strong').text()}
                    }
                })
            })
        )
    }),
    fetch(url+'?ChkCard=1').then((data) => data.text()).then(async (text) => {
        let $ = load(text);
        if(ratio['全国']) {
            ratio['全国'].card = $('.c-page-count>.c-page-count__num:last-of-type>strong').text()
        } else {
            ratio['全国'] = {card: $('.c-page-count>.c-page-count__num:last-of-type>strong').text()}
        }
        $('.list-balloon__table--pref>dd>ul>li>a').each((index, element) => {
            let pre = element.children[0].data.trim();
            plist.card[pre] = element.attribs.href
            fetch(element.attribs.href).then((data) => data.text()).then((text) => {
                let $ = load(text);
            })
        })
        await Promise.all(
            Object.keys(plist.card).map(pref => {
                return fetch(plist.card[pref]).then((data) => data.text()).then((text) => {
                    let $ = load(text)
                    if(ratio[pref]) {
                        ratio[pref].card = $('.c-page-count>.c-page-count__num:last-of-type>strong').text()
                    } else {
                        ratio[pref] = {card: $('.c-page-count>.c-page-count__num:last-of-type>strong').text()}
                    }
                })
            })
        )
    })
]).finally(() => {
    let data = {
        '全国': ratio['全国']
    }
    Object.keys(plist.all).map(pref => {
        data[pref] = ratio[pref]
    })
    writeFileSync('./ratio.json', JSON.stringify(data, null, 4))
})