#!/usr/bin/env node

const pify = require(`pify`)
const { readFile, writeFile } = pify(require(`fs`))
const { join: joinPath } = require(`path`)
const { get } = require(`httpie`)
const makeDir = require(`make-dir`)
const filenamify = require(`filenamify`)

const catchify = promise => promise.then(result => [ null, result ]).catch(err => [ err, null ])

// https://www.diigo.com/api_dev
const buildUrl = ({ count, step, apiKey, user }) => `https://secure.diigo.com/api/v2/bookmarks?key=${ apiKey }&user=${ user }&start=${ step * count }&count=${ count }&sort=1&filter=all`

const buildHeaders = ({ user, password }) => ({
	Authorization: `Basic ${ Buffer.from(`${ user }:${ password }`).toString(`base64`) }`,
})

const removeProtocol = urlString => {
	const [ , ...rest ] = urlString.split(`://`)
	return rest.join(``)
}

const diigoAndUserContentSeparator = `---\n`
const extension = `.md`

const stepper = async(increment, fn) => {
	let current = 0
	let shouldContinue = true

	while (shouldContinue) {
		shouldContinue = await fn(current)
		++current
	}
}

const main = async({ user, password, path, all, apiKey, countPerRequest }) => {
	const headers = buildHeaders({ user, password })
	const count = parseInt(countPerRequest, 10)

	await makeDir(path)

	await stepper(countPerRequest, async step => {
		const { data: bookmarks } = await get(buildUrl({ count, step, apiKey, user }), { headers })

		await updateBookmarksOnDisc({ bookmarks, path })

		return all && bookmarks.length === count
	})
}

const updateBookmarksOnDisc = async({ bookmarks, path }) => Promise.all(bookmarks.map(
	async({ tags, url, title, created_at: createdAt, desc: description }) => {
		const sanitizedName = filenamify(removeProtocol(url), {
			replacement: `_`,
			maxLength: 255 - extension.length,
		})
		const fullPath = joinPath(path, sanitizedName + extension)
		const diigoData = noteContents({ tags, url, title, createdAt })

		const [ err, currentContents ] = await catchify(readFile(fullPath, { encoding: `utf8` }))

		if (err && err.code === `ENOENT`) {
			await writeFile(fullPath, diigoData + `\n` + description + `\n`)
		} else if (err) {
			throw err
		} else {
			const [ , ...rest ] = currentContents.split(diigoAndUserContentSeparator)
			await writeFile(fullPath, diigoData + rest.join(diigoAndUserContentSeparator))
		}
	},
))

const noteContents = ({ tags, url, title, createdAt }) =>
	`# ${ title }

- tags: ${ tags.split(/,\s*/g).map(tag => `#${ tag }`).join(` `) }
- url: ${ url }
- cached: [On Diigo](https://www.diigo.com/cached?url=${ encodeURIComponent(url) })
- created: [[${ new Date(createdAt).toISOString().slice(0, 10) }]]

---
`

const args = require(`mri`)(process.argv.slice(2), {
	string: [ `user`, `password`, `path`, `apiKey`, `countPerRequest` ],
	boolean: `all`,
	default: {
		all: false,
		countPerRequest: 20,
	},
})

main(args).catch(err => {
	console.error(err)
	process.exit(1)
})
