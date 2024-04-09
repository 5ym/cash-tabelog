import { load } from "cheerio";

const url = "https://tabelog.com/rstLst";
let ratio = {};
let plist = {
  all: {},
  card: {},
};

Promise.all([
  fetch(url)
    .then((data) => data.text())
    .then(async (text) => {
      let $ = load(text);
      if (ratio["全国"]) {
        ratio["全国"].all = $(
          ".c-page-count>.c-page-count__num:last-of-type>strong"
        ).text();
      } else {
        ratio["全国"] = {
          all: $(".c-page-count>.c-page-count__num:last-of-type>strong").text(),
        };
      }
      $(".list-balloon__table--pref>dd>ul>li>a").each((_index, element) => {
        const che = $(element);
        let pre = che.first().text().trim();
        plist.all[pre] = che.attr("href");
      });
      await Promise.all(
        Object.keys(plist.all).map(async (pref) => {
          const data = await fetch(plist.all[pref]);
          const text = await data.text();
          let $ = load(text);
          if (ratio[pref]) {
            ratio[pref].all = $(
              ".c-page-count>.c-page-count__num:last-of-type>strong"
            ).text();
          } else {
            ratio[pref] = {
              all: $(
                ".c-page-count>.c-page-count__num:last-of-type>strong"
              ).text(),
            };
          }
        })
      );
    }),
  fetch(url + "?ChkCard=1")
    .then((data) => data.text())
    .then(async (text) => {
      let $ = load(text);
      if (ratio["全国"]) {
        ratio["全国"].card = $(
          ".c-page-count>.c-page-count__num:last-of-type>strong"
        ).text();
      } else {
        ratio["全国"] = {
          card: $(
            ".c-page-count>.c-page-count__num:last-of-type>strong"
          ).text(),
        };
      }
      $(".list-balloon__table--pref>dd>ul>li>a").each((_index, element) => {
        const che = $(element);
        let pre = che.first().text().trim();
        plist.card[pre] = che.attr("href");
      });
      await Promise.all(
        Object.keys(plist.card).map(async (pref) => {
          const data = await fetch(plist.card[pref]);
          const text = await data.text();
          let $ = load(text);
          if (ratio[pref]) {
            ratio[pref].card = $(
              ".c-page-count>.c-page-count__num:last-of-type>strong"
            ).text();
          } else {
            ratio[pref] = {
              card: $(
                ".c-page-count>.c-page-count__num:last-of-type>strong"
              ).text(),
            };
          }
        })
      );
    }),
]).finally(() => {
  let data = {
    全国: ratio["全国"],
  };
  Object.keys(plist.all).map((pref) => {
    data[pref] = ratio[pref];
  });
  Bun.write("./ratio.json", JSON.stringify(data, null, 4));
});
