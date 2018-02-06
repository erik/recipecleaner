// Try to handle all the wacky inconsistencies of recipes on the internet.

export function image (image) {
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


export function author (author) {
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
