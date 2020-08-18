#!/usr/bin/env node

const pify = require(`pify`)
const { writeFile } = pify(require(`fs`))
const { get } = require(`httpie`)
const untildify = require(`untildify`)

// https://www.diigo.com/api_dev
const countPerRequest = 100
const buildUrl = ({ step, apiKey, user }) => `https://secure.diigo.com/api/v2/bookmarks?key=${ apiKey }&user=${ user }&start=${ step * countPerRequest }&count=${ countPerRequest }&sort=0&filter=all`

const buildHeaders = ({ user, password }) => ({
	Authorization: `Basic ${ Buffer.from(`${ user }:${ password }`).toString(`base64`) }`,
})

const stepper = async(increment, fn) => {
	let current = 0
	let shouldContinue = true

	while (shouldContinue) {
		shouldContinue = await fn(current)
		++current
	}
}

const main = async({ user, password, path: potentiallyTildifiedPath, apiKey, datePrefix }) => {
	const headers = buildHeaders({ user, password })

	const path = untildify(potentiallyTildifiedPath)

	let synced = 0

	const noteTextChunks = []

	await stepper(countPerRequest, async step => {
		const { data: bookmarks } = await get(buildUrl({ step, apiKey, user }), { headers })

		const notes = bookmarks.map(({ tags, url, title, created_at: createdAt, desc: description }) => {
			const day = new Date(createdAt).toISOString().slice(0, 10)
			return noteContents({ tags, url, title, day, datePrefix, description })
		})

		noteTextChunks.push(...notes)

		synced += bookmarks.length

		return bookmarks.length === countPerRequest
	})

	await writeFile(path, noteTextChunks.join('\n'))

	console.log(`Synced`, synced, `bookmarks.`)
}

const noteContents = ({ tags, url, title, day, datePrefix, description }) =>
	`# ${ title }

- tags: ${ tags.split(/,\s*/g).map(tag => `#${ tag.replace(/_/g, `-`) }`).join(` `) }
- url: ${ url }
- cached: [On Diigo](https://www.diigo.com/cached?url=${ encodeURIComponent(url) })
- created: [[${ datePrefix }${ day }|${ day }]]

${description}
`

const args = require(`mri`)(process.argv.slice(2), {
	string: [ `user`, `password`, `path`, `apiKey`, `datePrefix` ],
	default: {
		datePrefix: ``,
	},
})

main(args).catch(err => {
	console.error(err)
	process.exit(1)
})
