const gn = require('./google-news')

const input = process.argv
if(!input[2]) return process.exit(1)

const run = async () => {
	try {
		await gn.init()
		await gn.searchNews(input[2])
		const data = await gn.getData(parseInt(input[3]) || 10)
		await gn.saveData(data, !input[4] ? input[2] + '.json' : input[4].match(/\.json/i) ? input[4] : input[4] + '.json')
		process.exit()
	} catch (error) {
		console.log(error)
		process.exit(1)
	}
}

run()