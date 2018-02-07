// Try to handle all the wacky inconsistencies of recipes on the internet.

function sanitizeImage (image) {
    if (!image) {
        return null;
    }

    if (image['@list']) {
        image = image['@list'];
    }

    if (Array.isArray(image)) {
        image = image.length > 0 ? image[0] : null;
    }

    if (image && image.url) {
        image = image.url;
    }

    return image;
}


function sanitizeAuthor (author) {
    if (!author) {
        return null;
    }

    if (Array.isArray(author)) {
        author = author.length > 0 ? author[0] : null;
    }

    // Sometimes a string, sometimes {"name": "..."}
    if (author && author.name !== undefined) {
        author = author.name;
    }

    // Some websites have author names be URLs
    if (author) {
        author = author.replace('/contributors/', '');
    }

    return author || null;
}

// PnYnMnDTnHnMnS
const numbers = '\\d+(?:[\\.,]\\d{0,3})?';
const weekPattern = `(?:${numbers}W)`;
const datePattern = `(?:${numbers}Y)?(?:${numbers}M)?(?:${numbers}D)?`;
const timePattern = `T(?:(${numbers})H)?(?:(${numbers})M)?(?:${numbers}S)?`;
const iso8601 = `^P(?:${weekPattern}|${datePattern}(?:${timePattern})?)$`;

// The ISO8601 regex for matching / testing durations
// Taken from https://github.com/tolu/ISO8601-duration (MIT)
const ISO8601_DURATION_RE = new RegExp(iso8601);

function sanitizeTime (time) {
    if (!time) {
        return null;
    }

    const match = time.trim().match(ISO8601_DURATION_RE);
    if (match !== null) {
        const [_match, hours, minutes] = match;
        const parts = [];

        if (hours && hours !== '0') {
            parts.push(`${hours} hr`);
        }

        if (minutes && minutes !== '0') {
            parts.push(`${minutes} min`);
        }

        return parts.length > 0 ? parts.join(' ') : null;
    }

    return null;
}


export default {
    image: sanitizeImage,
    author: sanitizeAuthor,
    time: sanitizeTime,
};
