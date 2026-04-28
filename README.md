# bookmarklets
This repository contains a collections of bookmarklets that are more or less useful.

## Disclaimer
Since the scripts provided here usually heavily rely on the HTML structure of the website they're targeted at, they may break at any time if the website in question is changed. Use at your own risk.

## Usage Instructions
1. Copy code in bookmarklet (e.g. using button "Copy raw file" on the top right).
2. Create a new bookmark in your browser using the code as URL.
3. Visit the website the bookmarklet is intended for.
4. Click on the bookmark.
5. Depending on the contents of the bookmarklet, some new content should become visible.

## Currently available bookmarklets
- [GoVolta Availability Calendar](./govolta/README.md)
- [European Sleeper Referral Code](./european_sleeper/README.md)
- [Hellenic Train Ticket Search](hellenic_train/README.md)
- [MÁV Hidden Stations](mav_hidden_stations/README.md)

## Coding Instructions
Always use `/* ... */` comments! Since all code within a bookmarklet will be put on a single line inside the bookmark, other types of comment may comment out all code following that comment.

## Trivia
What is a "bookmarklet"? [Wikipedia](https://en.wikipedia.org/wiki/Bookmarklet) says:

> A bookmarklet is a bookmark stored in a web browser that contains JavaScript commands that add new features to the browser. They are stored as the URL of a bookmark in a web browser or as a hyperlink on a web page. Bookmarklets are usually small snippets of JavaScript executed when user clicks on them. When clicked, bookmarklets can perform a wide variety of operations, such as running a search query from selected text or extracting data from a table.
