Sync all your Diigo bookmarks to a directory as Markdown files.  Intended for use with [Obsidian](https://obsidian.md/).

## Install

```sh
npm i -g sync-diigo-to-single-file
```

## Use

```sh
sync-diigo-to-single-file --path=/Users/tehshrike/Obsidian/Bookmarks.md --user=DIIGO_USERNAME --password=DIIGO_PASSWORD --apiKey=DIIGO_API_KEY
```

### Arguments

- `path`: the file to write output to
- `user`: your Diigo username
- `password`: your Diigo password
- `apiKey`: your [Diigo API key](https://www.diigo.com/api_keys/new/)
- `datePrefix`: a string to prefix the `[[YYYY-MM-DD]]` date links with (e.g. `Day/`)

## Output

Right now the output for a couple random bookmarks looks like:

```md
# What do executives do, anyway?

- tags: #management #organization #leader
- url: https://apenwarr.ca/log/?m=201909
- cached: [On Diigo](https://www.diigo.com/cached?url=https%3A%2F%2Fapenwarr.ca%2Flog%2F%3Fm%3D201909)
- created: [[Day/2020-05-21|2020-05-21]]



# Roll Your Own Frameworks | Secret Weblog

- tags: #software
- url: https://blog.startifact.com/posts/roll-your-own-frameworks/
- cached: [On Diigo](https://www.diigo.com/cached?url=https%3A%2F%2Fblog.startifact.com%2Fposts%2Froll-your-own-frameworks%2F)
- created: [[Day/2020-05-21|2020-05-21]]


```

## License

[WTFPL](https://wtfpl2.com)
