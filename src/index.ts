import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth"
puppeteer.use(StealthPlugin())

import * as cheerio from "cheerio";
import axios from "axios";

export async function ScrapeCategories(): Promise<Array<string>> {
    try {
        const response = await axios.get('https://www.korisnaknjiga.com/')
        const $ = cheerio.load(response.data)
        const PageTitle = $('title').text().trim();
        const categoryLinks: Array<string> = [];

        // Find the div with id="oblasti" and get all li elements within it
        $('#oblasti li').each((index, element) => {
            const $element = $(element);
            console.log($element.find('a').attr('href'))
            categoryLinks.push($element.find('a').attr('href')!)
        });
        // console.log(categoryLinks)
        return categoryLinks.filter(item => !item.includes('https:'))
    } catch (error) {
        console.log(error)
        throw error
    }
};


/* (async () => {
    try {
        const url = "https://www.korisnaknjiga.com/popularna-psihologija-oblast-38"
        const response = await axios.get(url)
        const $ = cheerio.load(response.data)

        const pagesLinks: Array<string> = [];
        $("#broj-stranice a").each((index, element) => {
            const $eleemnt = $(element)
            //pagesLinks.push($eleemnt.attr('href')!)
            const link = $eleemnt.attr('href')
            if (link !== undefined) pagesLinks.push(link)
        })

        const booksLinks: Array<string> = []
        const books = $('#izabrana-oblast a').each((index, ele) => {
            const $element = $(ele)
            const link = $element.attr('href')
            if (link !== undefined) booksLinks.push(link)
        })
        for (var i = 0; i < pagesLinks.length; i++) {
            const response = await axios.get(`https://www.korisnaknjiga.com${pagesLinks[i].trim()}`)
            const $ = cheerio.load(response.data)
            const books = $('#izabrana-oblast a').each((index, ele) => {
                const $element = $(ele)
                const link = $element.attr('href')
                if (link !== undefined) booksLinks.push(link)
            })
        }

        console.log(pagesLinks)
        console.log(booksLinks)
        console.log(booksLinks.length)

    } catch (error) {
        console.log(error)
    }
})() */



async function ScrapePages(url: string): Promise<Array<string>> {

    try {
        const response = await axios.get(`https://www.korisnaknjiga.com/${url}`)
        const $ = cheerio.load(response.data)

        const pagesLinks: Array<string> = [];

        $("#broj-stranice a").each((index, element) => {
            const $eleemnt = $(element)
            //pagesLinks.push($eleemnt.attr('href')!)
            const link = $eleemnt.attr('href')
            if (link !== undefined) pagesLinks.push(link)
        })
        pagesLinks.push(pagesLinks[0].replace('=2', '=1'))
        return pagesLinks
    } catch (error) {
        throw error
    }
}



async function scrapeBooksDetail(booklinks: Array<string>): Promise<any> {
    const base = "https://www.korisnaknjiga.com";
    console.log(`Going To Scrape ${booklinks.length} book`)

    const books: Array<unknown> = []
    for (let index = 0; index < booklinks.length; index++) {
        const element = booklinks[index];
        try {
            const response = await axios.get(`${base}/${element}`)
            const $ = cheerio.load(response.data);
            let title: string = "N/A";
            let price: string = "N/A";
            const tit = $('#naslov > h1')
            if (tit) {
                title = tit.text().toString().trim()
            }
            const prix = $('h5')
            if (prix && prix.text().toString().includes('Cena')) {
                price = prix.text().toString().split(':')[1].trim()
            }
            let thumbnail = $('#naslovna-p img').attr('src')

            let catego = $('#kategorije').text().toString()
            const category = catego.split('\n')[2].trim()

            let description = $('#ceoTekst').text().toString().trim()

            let auth = $('div.author').text().toString().trim()
            console.log(auth)

            const result = {
                title, price, thumbnail, category, description, url: element, author: auth
            }

            books.push(result)
            console.log(result)
        } catch (error) {
            console.log(error)
        }
    }
    return books
}


async function scrapeBookLinks(pages: Array<string>): Promise<Array<string>> {
    const base = "https://www.korisnaknjiga.com";
    const response: Array<string> = [];
    for (let index = 0; index < pages.length; index++) {
        const element = pages[index];
        const res = await axios.get(`${base}${element}`);
        const $ = cheerio.load(res.data);
        $('#izabrana-oblast a').each((index, ele) => {
            const $element = $(ele)
            const link = $element.attr('href')
            if (link !== undefined) response.push(link)
        })
    }
    return response
}


import { ReadCategories, WriteCategoreis } from "./component";
import { appendJsonToCsv } from "./component/json_2_csv";

(async () => {
    /*  WriteCategoreis(await ScrapeCategories()) */
    let categories = await ReadCategories();
    for (let index = 0; index < categories.length; index++) {
        const element = categories[index];
        try {
            let pages = await ScrapePages(element);
            let bookLinks = await scrapeBookLinks(pages)
            console.log(bookLinks)
            console.log(bookLinks.length)
            let books = await scrapeBooksDetail(bookLinks)
            await appendJsonToCsv(books, "result.csv", ['title', "price", "thumbnail", "category", "description", "url", "author"])
            //fs.writeFileSync("result.csv", csvString, { flag: "a" })
            let newCategory = categories.filter(item => item !== element)
            await WriteCategoreis(newCategory)
        } catch (error) {
            console.log(error)
        }
    }

})()