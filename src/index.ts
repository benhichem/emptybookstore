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
        if (pagesLinks.length === 0) return [`/${url}`]
        pagesLinks.push(pagesLinks[0].replace('=2', '=1'))
        console.log(pagesLinks)
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


/* import { ReadCategories, WriteCategoreis } from "./component";
import { appendJsonToCsv } from "./component/json_2_csv";

(async () => {

    let categories = await ReadCategories();
    for (let index = 0; index < categories.length; index++) {
        const element = categories[index];
        console.log(`Category to scrape is :: ${element}`)
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

})() */


// Define the URL for the plant page
const url = 'http://www.rightplants4me.co.uk/plant/1';

async function scrapePlantData() {
    try {
        // Fetch the HTML of the page
        const { data } = await axios.get(url);

        // Load HTML into cheerio for parsing
        const $ = cheerio.load(data);
        console.log(data)
        // Define an object to hold the scraped data
        let plantData = {};


        // Select the plant's common name and scientific name
        //@ts-ignore
        plantData.commonName = $('h2').text().trim();
        //@ts-ignore
        plantData.scientificName = $('.plant-scientific-name').text().trim();

        // Scrape height from the specific div with class 'col-4 col-sm-5'
        const heightText = $('div.col-4.col-sm-5').has('h4.title:contains("Height")').next('p').text().trim();

        //@ts-ignore
        plantData.height = heightText || "Not found";

        // Scrape the rest of the details from the table
        //@ts-ignore
        plantData.details = {};
        $('.plant-details-table tr').each((index, element) => {
            const key = $(element).find('th').text().trim();
            const value = $(element).find('td').text().trim();
            if (key && value) {
                //@ts-ignore
                plantData.details[key] = value;
            }
        });

        console.log(plantData);
    } catch (error) {
        console.error('Error fetching plant data:', error);
    }
}

scrapePlantData();