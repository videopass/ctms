export function buildUrlQueryString(object: any) {
    return Object.keys(object).map(key => encodeURIComponent(key) + '=' + encodeURIComponent(object[key])).join('&');
}
