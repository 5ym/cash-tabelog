const axios = require('axios')
const cheerio = require('cheerio')
const fs = require('fs')
const url = 'https://tabelog.com/rstLst'
let ratio = {}
let plist = {
    all: {},
    card: {}
}

Promise.all([
    axios(url).then(async ({ data }) => {
        let $ = cheerio.load(data);
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
                return axios(plist.all[pref]).then(({data}) => {
                    let $ = cheerio.load(data)
                    if(ratio[pref]) {
                        ratio[pref].all = $('.c-page-count>.c-page-count__num:last-of-type>strong').text()
                    } else {
                        ratio[pref] = {all: $('.c-page-count>.c-page-count__num:last-of-type>strong').text()}
                    }
                })
            })
        )
    }),
    axios(url+'?ChkCard=1').then(async ({ data }) => {
        let $ = cheerio.load(data);
        if(ratio['全国']) {
            ratio['全国'].card = $('.c-page-count>.c-page-count__num:last-of-type>strong').text()
        } else {
            ratio['全国'] = {card: $('.c-page-count>.c-page-count__num:last-of-type>strong').text()}
        }
        $('.list-balloon__table--pref>dd>ul>li>a').each((index, element) => {
            let pre = element.children[0].data.trim();
            plist.card[pre] = element.attribs.href
            axios(element.attribs.href).then(({data}) => {
                let $ = cheerio.load(data);
            })
        })
        await Promise.all(
            Object.keys(plist.card).map(pref => {
                return axios(plist.card[pref]).then(({data}) => {
                    let $ = cheerio.load(data)
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
    fs.writeFileSync('./ratio.json', JSON.stringify(data, null, 4))
})