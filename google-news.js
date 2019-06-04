const puppeteer = require('puppeteer')
const fs = require('fs')

const BASE_URL = 'https://www.google.co.id/'
let query = ''

const gn = {
	browser: null,
	page: null,
	init: async () => {
		gn.browser = await puppeteer.launch({
			headless: false,
			args: ['--no-sandbox', '--disable-setuid-sandbox'],
		})
		gn.page = await gn.browser.newPage()
		gn.page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/71.0.3578.98 Safari/537.36')
		gn.page.setViewport({ width: 1366, height: 768 })
		gn.page.setDefaultTimeout(60000)
		await gn.page.goto(BASE_URL)
		await gn.page.setRequestInterception(true)
		gn.page.on('request', req => {
			if(req.resourceType() === 'image' || req.resourceType() === 'font' || req.resourceType() === 'stylesheet'){
				req.abort()
			} else {
				req.continue()
			}
		})
		await gn.page.waitFor('[aria-autocomplete=both]')
	},
	searchNews: async search => {
		query = encodeURI(search)
		const input = await gn.page.$('[aria-autocomplete=both]')
		await input.type(search)
		await Promise.all([
			gn.page.waitForNavigation(),
			input.press('Enter')
		])
		const berita = await gn.page.$x("//a[text()='Berita']")
		await Promise.all([
			gn.page.waitForNavigation(),
			berita[0].click()
		])
	},
	getData: async count => {
		let data = {
			titles: [],
			medias: [],
			dates: [],
			descriptions: [],
		}
		let data2 = []
		for(let i = 0; i < count; i++){
			await gn.page.waitFor(`[data-async-context="query:${query}"]`)
			if(data.titles.length < count) {
				data.titles = data.titles.concat(await gn.page.$$eval(`[data-async-context="query:${query}"] .g > div > div > h3`, titles => titles.map(title => title.textContent)))
				data.medias = data.medias.concat(await gn.page.$$eval(`[data-async-context="query:${query}"] .g > div > div > div > span:nth-child(1)`, medias => medias.map(media => media.textContent)))
				data.dates = data.dates.concat(await gn.page.$$eval(`[data-async-context="query:${query}"] .g > div > div > div > span:nth-child(3)`, dates => dates.map(date => date.textContent)))
				data.descriptions = data.descriptions.concat(await gn.page.$$eval(`[data-async-context="query:${query}"] .g > div > div > div:nth-child(3)`, descriptions => descriptions.map(description => description.textContent)))
			}
			if(data.titles.length < count) {
				const nextPage = await gn.page.$$('#foot .navend a')
				await Promise.all([
					gn.page.waitForNavigation(),
					i === 0 ? nextPage[0].click() : nextPage[1].click()
				])
			}
		}
		console.log('test')
		for(let i = 0; i < count; i++) {
			data2.push({
				title: data.titles[i],
				media: data.medias[i],
				date: data.dates[i],
				description: data.descriptions[i]
			})
		}
		return data2
	},
	saveData: async (data, path) => {
		await fs.writeFileSync(path, JSON.stringify(data, null, 4))
		console.log('success')
	}
}

module.exports = gn