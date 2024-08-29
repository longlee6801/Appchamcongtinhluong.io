async function sendRequest(url, method, headers, body) {
    return new Promise((resolve, reject) => {
        tt.request({
            url: url,
            method: method,
            data: body,
            header: headers,
            success: function(result) {
                resolve(result.data);
            },
            fail: function({errMsg}) {
                console.error('Request failed:', errMsg);
                reject(new Error(`Request failed: ${errMsg}`));
            }
        });
    });
}

export { sendRequest };