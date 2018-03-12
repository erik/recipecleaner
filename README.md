# RecipeThing

Recipe sites suck. Make them suck a little less.

![](https://i.imgur.com/U5NXFip.png)

Even with an ad blocker, recipe sites are a messy experience. Popups
asking you to subscribe, pages and pages of filler text about where
the recipe came from, tons of images to scroll through, and then
the recipe is tucked away at the bottom somewhere.

RecipeThing shows you only what you care about: what you're making,
what you need, and how to make it.

Available for
**[Firefox](https://addons.mozilla.org/en-US/firefox/addon/recipething/)**
and
**[Chrome](https://chrome.google.com/webstore/detail/recipe-thing/omonbdfjebcopdfdkiaaajifkaelcohp)**



## Building

If you'd rather build the extension yourself rather than downloading
from the extension stores.

    npm install
    npm run build

    # Open a firefox window with the extension already loaded in.
    npm run web-ext

    # Rebuild on files changed:
    npm run build:watch

    # Run tests on files changed
    npm run test:watch

    # Check for style violations
    npm run lint

## License

RecipeThing is available under GNU GPLv3. See `LICENSE` in the root of
this repository.

RecipeThing's icon is derived from FontAwesome, which is licensed as
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
