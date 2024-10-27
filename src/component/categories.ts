import fs from "node:fs";

export async function WriteCategoreis(categoryLinks: Array<string>) {
    try {
        fs.rmSync('categories.txt')
        const categories = "categories.txt";
        fs.writeFileSync(categories, categoryLinks.toString())
    } catch (error) {
        console.log(error)
    }
}
export async function ReadCategories() {
    try {
        const response = fs.readFileSync("categories.txt").toString().split(',');
        return response
    } catch (error) {
        throw error
    }
}