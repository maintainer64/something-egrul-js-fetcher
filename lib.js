export async function EfrulFetchData(data) {
    const myHeaders = {
        "Accept": "*/*",
        "Accept-Language": "ru,en;q=0.9",
        "Connection": "keep-alive",
        "X-Requested-With": "XMLHttpRequest",
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 YaBrowser/24.7.0.0 Safari/537.36"
    }

    async function _retry(count, func, ...args) {
        const response = await func(...args);
        if (!count) return response
        if (response == null || response?.STATUS === 500) {
            await new Promise(r => setTimeout(r, 1000));
            return await _retry(count - 1, func, ...args);
        }
        return response
    }

    async function _firstInit() {
        const requestOptions = {
            method: "GET",
            headers: myHeaders,
            redirect: "follow",
            credentials: 'include',
        };
        const response = await fetch("https://pb.nalog.ru/index.html", requestOptions);
        return await response.text();
    }

    async function _searchProcByInnAndOgrn(inn, ogrn) {
        const raw = `mode=search-all&queryAll=${ogrn}&queryUl=&okvedUl=&regionUl=&statusUl=&isMspUl=&mspUl1=1&mspUl2=1&mspUl3=1&queryIp=&okvedIp=&regionIp=&statusIp=&isMspIp=&mspIp1=1&mspIp2=1&mspIp3=1&taxIp=&queryUpr=&uprType1=1&uprType0=1&queryRdl=&dateRdl=&queryAddr=&regionAddr=&queryOgr=&ogrFl=1&ogrUl=1&ogrnUlDoc=&ogrnIpDoc=&npTypeDoc=1&nameUlDoc=&nameIpDoc=&formUlDoc=&formIpDoc=&ifnsDoc=&dateFromDoc=&dateToDoc=&page=1&pageSize=10&pbCaptchaToken=&token=`;

        const requestOptions = {
            method: "POST",
            headers: myHeaders,
            body: raw,
            redirect: "follow",
            credentials: 'include',
        };
        const response = await fetch("https://pb.nalog.ru/search-proc.json", requestOptions);
        return await response.json();
    }

    async function _searchProcByInnAndOgrnResponse(id) {
        const raw = `id=${id}&method=get-response`;

        const requestOptions = {
            method: "POST",
            headers: myHeaders,
            body: raw,
            redirect: "follow",
            credentials: 'include',
        };
        const response = await fetch("https://pb.nalog.ru/search-proc.json", requestOptions);
        return await response.json();
    }

    async function _companyProcByToken(token) {
        const raw = `token=${token}&method=get-request`;

        const requestOptions = {
            method: "POST",
            headers: myHeaders,
            body: raw,
            redirect: "follow",
            credentials: 'include',
        };
        const response = await fetch("https://pb.nalog.ru/company-proc.json", requestOptions);
        return await response.json();
    }

    async function _companyProcByTokenResponse(token, id) {
        const raw = `token=${token}&id=${id}&method=get-response`;

        const requestOptions = {
            method: "POST",
            headers: myHeaders,
            body: raw,
            redirect: "follow",
            credentials: 'include',
        };

        const response = await fetch("https://pb.nalog.ru/company-proc.json", requestOptions);
        return await response.json();
    }

    const {innOrg, ogrnOrg, fioRuk, innRuk} = data;
    let response = await _retry(5, _firstInit);
    response = await _retry(10, _searchProcByInnAndOgrn, innOrg, ogrnOrg);
    response = await _retry(10, _searchProcByInnAndOgrnResponse, response.id);
    const dataOrgsUl = response?.ul?.data?.filter((item) => !!item.token && item?.inn == innOrg);
    if (!dataOrgsUl || dataOrgsUl.length == 0) return {
        fioRukStatus: false,
        innRukStatus: false,
        hasData: false
    };
    response = await _retry(5, _firstInit);
    response = await _retry(10, _companyProcByToken, dataOrgsUl[0].token);
    response = await _retry(10, _companyProcByTokenResponse, response.token, response.id);
    if (response?.vyp?.masruk?.filter((item) => item?.name === fioRuk && item?.inn === innRuk).length >= 1) {
        return {
            fioRukStatus: true,
            innRukStatus: true,
            hasData: true
        };
    }
    let fioRukStatus = response?.vyp?.masruk?.filter((item) => item?.name === fioRuk).length >= 1
    let innRukStatus = response?.vyp?.masruk?.filter((item) => item?.inn === innRuk).length >= 1
    innRukStatus = fioRukStatus && innRukStatus ? false : innRukStatus
    return {
        fioRukStatus: fioRukStatus,
        innRukStatus: innRukStatus,
        hasData: true
    };
}