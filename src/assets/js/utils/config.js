/**
 * @license CC-BY-NC 4.0 - https://creativecommons.org/licenses/by-nc/4.0/
 */

const pkg = require('../package.json');
const fetch = require("node-fetch");
const convert = require("xml-js");

const settings_url = pkg.user ? `${pkg.settings}/${pkg.user}` : pkg.settings;
const settings_urI = new URL(settings_url);
const configUrl = pkg.env === 'azuriom' ? `${settings_urI}api/centralcorp/options` : `${settings_urI}/utils/api`;

class Config {
    async GetConfig() {
        try {
            const response = await fetch(configUrl);
            return await response.json();
        } catch (error) {
            console.error("Failed to fetch config:", error);
            throw error;
        }
    }

    async GetNews() {
        try {
            this.config = await this.GetConfig();
            const baseUrl = settings_url.endsWith('/') ? settings_url : `${settings_url}/`;
            const newsUrl = new URL('/api/rss', pkg.env === 'azuriom' ? baseUrl : this.config.azauth);

            const rss = await fetch(newsUrl).then(res => res.text());
            const rssParsed = JSON.parse(convert.xml2json(rss, { compact: true }));
            const items = rssParsed.rss.channel.item;

            if (!items) {
                return [{
                    title: "Aucun article disponible",
                    content: "Aucun article n'a été trouvé.",
                    author: "",
                    publish_date: "2024"
                }];
            }

            return Array.isArray(items) ? items.map(this.parseNewsItem) : [this.parseNewsItem(items)];
        } catch (error) {
            console.error("Failed to fetch news:", error);
            throw error;
        }
    }

    parseNewsItem(item) {
        return {
            title: item.title._text,
            content: item['content:encoded']._text,
            author: item['dc:creator']._text,
            publish_date: item.pubDate._text
        };
    }
}

export default new Config();
