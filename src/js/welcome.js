// Run inside first time user experience.

const visible = 'display: block;';

if (/firefox/i.test(navigator.userAgent)) {
    document.querySelector('#firefox').style = visible;
} else {
    document.querySelector('#chrome').style = visible;
}
