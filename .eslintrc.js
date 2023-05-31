module.exports = {
    "env": {
        "browser": true,
        "es6": true,
        "webextensions": true
    },
    "extends": "eslint:recommended",
    "parserOptions": {
	"ecmaVersion": 2018,
        "sourceType": "module",
        "ecmaFeatures": {}
    },
    "rules": {
        "indent": [
            "error",
            2
        ],
        "linebreak-style": [
            "error",
            "unix"
        ],
        "quotes": [
            "warn",
            "single"
        ],
        "semi": [
            "error",
            "always"
        ],
        "no-console": "off",
        "space-before-function-paren": [
            "error", {
                "named": "always",
                "asyncArrow": "always",
                "anonymous": "always"
            }
        ]
    }
};
