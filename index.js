const puppeteer = require('puppeteer');
const fs = require("fs");
async function run() {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setRequestInterception(true);
    page.on("request", (request) => {
        if (request.resourceType === "Image") {
            request.abort();
        } else {
            request.continue();
        }
    });

    await page.goto('https://animeflv.net/browse', { timeout: 0 });
    await page.waitForSelector("body");
    //await page.screenshot({ path: 'screenshot.png' });

    var URLs = await page.evaluate(() => {
        let URLs = [];
        for (var item of document.querySelectorAll(".ListAnimes li .Anime > a")) {
            URLs.push(item.href);
        }

        return URLs;
    });
    let animes = [];
    for (var url of URLs) {
        console.log(url);
        await page.goto(url, { waitUntil: "networkidle0", timeout: 0 });
        await page.waitFor(5000);
        var content = await page.evaluate(() => {
            let anime = {};
            anime.cover = document.querySelector(".AnimeCover img").src;
            anime.title = document.querySelector(".Ficha .Title").innerText;
            anime.type = document.querySelector(".Ficha .Type").innerText;
            anime.tags = [...document.querySelectorAll(".Container .Nvgnrs a")].map(item => item.innerText);
            anime.description = document.querySelector(".Container .Description").innerText;
            anime.status = document.querySelector(".Container .AnmStts span").innerText;
            anime.capitules = [...document.querySelectorAll(".ListCaps li:not(.Next)")].map(item => {
                let capitules = {};
                capitules.cover = item.querySelector("img").src;
                capitules.title = item.querySelector(".Title").innerText;
                capitules.episode = item.querySelector("p").innerText;
                capitules.link = item.querySelector("a").href;
                return capitules;
            });
            return anime;
        })
        animes.push(content)
    }
    fs.writeFileSync("output.json", JSON.stringify(animes));

    browser.close();
    process.exit();

}

run();
