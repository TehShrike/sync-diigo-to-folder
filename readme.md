Sync all your Diigo bookmarks to a directory as Markdown files.  Intended for use with [Obsidian](https://obsidian.md/).

## Install

```sh
npm i -g sync-diigo-to-folder
```

## Use

```sh
sync-diigo-to-folder --path=/Users/tehshrike/Obsidian/Bookmarks --all --user=DIIGO_USERNAME --password=DIIGO_PASSWORD --apiKey=DIIGO_API_KEY
```

This script is meant to be idempotent, so that you can re-run it over and over without losing any data other than what originally came from Diigo.

By default it only reads the most recently-updated batch of bookmarks.

### Arguments

- `path`: the directory to write output files to
- `all`: *(default off)* – whether to save the most recently-updated bookmarks, or only one request's worth
- `countPerRequest`: *(default 20)* – How many bookmarks to fetch per API request.  Max 100.
- `user`: your Diigo username
- `password`: your Diigo password
- `apiKey`: your [Diigo API key](https://www.diigo.com/api_keys/new/)
- `datePrefix`: a string to prefix the `[[YYYY-MM-DD]]` date links with (e.g. `Day/`)

## Output

Right now the output for a bookmark of a site like <https://danluu.com/corp-eng-blogs/> looks like:

```md
# How (some) good corporate engineering blogs are written

- tags: #writing #marketing #blogging
- url: https://danluu.com/corp-eng-blogs/
- cached: [On Diigo](https://www.diigo.com/cached?url=https%3A%2F%2Fdanluu.com%2Fcorp-eng-blogs%2F)
- created: [[2020-07-13]]

---


```

the intention is that you can put your own notes below the `---` separator as desired.  Any changes above the separator will be overwritten by changes to your bookmark in Diigo.

If you typed a description into Diigo, that description will be placed below the `---` separator on first write.  Updated descriptions will not be written to a pre-existing file.

## License

[WTFPL](https://wtfpl2.com)
