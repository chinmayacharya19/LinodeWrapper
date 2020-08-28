let fetch = require("node-fetch")
let Headers = require("node-fetch").Headers

const TOKEN = "Bearer " + "ecdc5a68bfeae28ea9ac3d395bb1e2959abc9dbe7deb5b6b65c948ac1330b6d9"

async function listRegions() {
    var requestOptions = {
        method: 'GET',
        redirect: 'follow'
    };

    let response = await fetch("https://api.linode.com/v4/regions", requestOptions)
    try {
        let result = await response.json()
        console.log(result)
        return result;
    }
    catch (error) {
        console.log('error', error);
    }
}
async function listStackScript(pageno) {
    var myHeaders = new Headers();
    myHeaders.append("Authorization", "Bearer ecdc5a68bfeae28ea9ac3d395bb1e2959abc9dbe7deb5b6b65c948ac1330b6d9");

    var requestOptions = {
        method: 'GET',
        headers: myHeaders,
        redirect: 'follow'
    };

    pageno = pageno || 1;
    let response = await fetch("https://api.linode.com/v4/linode/stackscripts?page_size=500&page=" + pageno, requestOptions)
    try {
        let result = await response.json()
        return result
    }
    catch (error) {
        console.log('error', error);
        throw error;
    }
}
async function getIdOfStackScript() {
    let arr = await listStackScript(1)
    let arrFirstPage = arr
    let page = arr.pages || 1
    while (page && page > 0) {
        let arr = {}
        if (page === 1) {
            arr = arrFirstPage
        }
        else {
            arr = await listStackScript(page)
        }
        for (let a of arr.data) {
            if (a.label === "SquidProxyScript") {
                return a.id;
            }
        }
        page--
    }
    return null
}
async function createStackScript() {
    var myHeaders = new Headers();
    myHeaders.append("Authorization", TOKEN);
    myHeaders.append("Content-Type", "application/json");

    var raw = JSON.stringify({ "images": ["linode/centos7"], "label": "SquidProxyScript", "script": "#! /bin/bash\n yum install squid wget httpd-tools -y\n touch /etc/squid/passwd\n htpasswd -b /etc/squid/passwd test 123\n wget -O /etc/squid/squid.conf https://raw.githubusercontent.com/kurt2467/ProxyCreator/master/squid.conf --no-check-certificate\n touch /etc/squid/blacklist.acl\n systemctl restart squid && systemctl enable squid\n iptables -I INPUT -p tcp --dport 3128 -j ACCEPT\n iptables-save" });

    var requestOptions = {
        method: 'POST',
        headers: myHeaders,
        body: raw,
        redirect: 'follow'
    };

    let response = await fetch("https://api.linode.com/v4/linode/stackscripts", requestOptions)
    try {
        let result = await response.json()
        console.log(result)
        return result.id
    }
    catch (error) {
        console.log('error', error);
    }
}
async function createLinode(region, password, stackscript_id) {
    var myHeaders = new Headers();
    myHeaders.append("Authorization", TOKEN);
    myHeaders.append("Content-Type", "application/json");

    var raw = JSON.stringify({ "region": region || "ap-west", "type": "g6-nanode-1", "image": "linode/centos7", "root_pass": password || "NakoNaShashwat", stackscript_id });

    var requestOptions = {
        method: 'POST',
        headers: myHeaders,
        body: raw,
        redirect: 'follow'
    };

    let response = await fetch("https://api.linode.com/v4/linode/instances", requestOptions)
    try {
        let result = await response.text()
        console.log(result)
    }
    catch (error) {
        console.log('error', error);
    }
}
async function destroyLinode(id) {
    var myHeaders = new Headers();
    myHeaders.append("Authorization", TOKEN);

    var requestOptions = {
        method: 'DELETE',
        headers: myHeaders,
        redirect: 'follow'
    };

    let response = await fetch("https://api.linode.com/v4/linode/instances/" + id, requestOptions)
    try {
        let result = await response.text()
        console.log(result)
    }
    catch (error) {
        console.log('error', error);
    }
}

async function create() {
    let region = await listRegions()
    let id = await getIdOfStackScript()
    if (!id) {
        id = await createStackScript()
    }
    await createLinode("ap-west", "NakoNaShashwat", id)

}

create();