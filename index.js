#!/usr/bin/env node

const pify = require(`pify`)
const { readFile, writeFile, utimes } = pify(require(`fs`))
const { join: joinPath } = require(`path`)
const { get } = require(`httpie`)
const makeDir = require(`make-dir`)
const filenamify = require(`filenamify`)
const untildify = require(`untildify`)

const catchify = promise => promise.then(result => [ null, result ]).catch(err => [ err, null ])

// https://www.diigo.com/api_dev
const buildUrl = ({ count, step, apiKey, user }) => `https://secure.diigo.com/api/v2/bookmarks?key=${ apiKey }&user=${ user }&start=${ step * count }&count=${ count }&sort=1&filter=all`

const buildHeaders = ({ user, password }) => ({
	Authorization: `Basic ${ Buffer.from(`${ user }:${ password }`).toString(`base64`) }`,
})

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

const main = async({ user, password, path: potentiallyTildifiedPath, all, apiKey, countPerRequest }) => {
	const headers = buildHeaders({ user, password })
	const count = parseInt(countPerRequest, 10)

	const path = untildify(potentiallyTildifiedPath)

	await makeDir(path)

	let synced = 0

	await stepper(countPerRequest, async step => {
		const { data: bookmarks } = await get(buildUrl({ count, step, apiKey, user }), { headers })

		await updateBookmarksOnDisc({ bookmarks, path })

		synced += bookmarks.length

		return all && bookmarks.length === count
	})

	console.log(`Synced`, synced, `bookmarks.`)
}

const updateBookmarksOnDisc = async({ bookmarks, path }) => {
	const now = new Date()

	return Promise.all(bookmarks.map(
		async({ tags, url, title, created_at: createdAt, updated_at: updatedAt, desc: description }) => {
			const sanitizedName = filenamify(title, {
				replacement: `_`,
				maxLength: 255 - extension.length,
			})
			const fullPath = joinPath(path, sanitizedName + extension)
			const diigoData = noteContents({ tags, url, title, createdAt })

			const [ err, currentContents ] = await catchify(readFile(fullPath, { encoding: `utf8` }))

			const setModifiedTime = () => utimes(fullPath, now, new Date(updatedAt))

			if (err && err.code === `ENOENT`) {
				await writeFile(fullPath, diigoData + `\n` + description + `\n`)
				await setModifiedTime()
			} else if (err) {
				throw err
			} else {
				const [ , ...rest ] = currentContents.split(diigoAndUserContentSeparator)
				await writeFile(fullPath, diigoData + rest.join(diigoAndUserContentSeparator))
				await setModifiedTime()
			}
		},
	))
}

const noteContents = ({ tags, url, title, createdAt }) =>
	`# ${ title }

- tags: ${ tags.split(/,\s*/g).map(tag => `#${ tag.replace(/_/g, `-`) }`).join(` `) }
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
