def create_proxy_auth_extension(proxy_host, proxy_port, proxy_user, proxy_pass,
                                 scheme='http', plugin_path=None):
    import string
    import zipfile
    import os

    manifest_json = """
    {
        "version": "1.0.0",
        "manifest_version": 2,
        "name": "Proxy Auth Extension",
        "permissions": [
            "proxy",
            "tabs",
            "unlimitedStorage",
            "storage",
            "<all_urls>",
            "webRequest",
            "webRequestBlocking"
        ],
        "background": {
            "scripts": ["background.js"]
        }
    }
    """

    background_js = string.Template(
        """
        var config = {
                mode: "fixed_servers",
                rules: {
                singleProxy: {
                    scheme: "${scheme}",
                    host: "${host}",
                    port: parseInt(${port})
                },
                bypassList: ["localhost"]
                }
            };

        chrome.proxy.settings.set({value: config, scope: "regular"}, function() {});

        chrome.webRequest.onAuthRequired.addListener(
            function(details, callbackFn) {
                callbackFn({
                    authCredentials: {
                        username: "${username}",
                        password: "${password}"
                    }
                });
            },
            {urls: ["<all_urls>"]},
            ['blocking']
        );
        """
    ).substitute(
        host=proxy_host,
        port=proxy_port,
        username=proxy_user,
        password=proxy_pass,
        scheme=scheme
    )

    if plugin_path is None:
        plugin_path = os.path.join(os.getcwd(), 'proxy_auth_plugin.zip')

    with zipfile.ZipFile(plugin_path, 'w') as zp:
        zp.writestr("manifest.json", manifest_json)
        zp.writestr("background.js", background_js)

    return plugin_path
