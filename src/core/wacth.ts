const puppeteer = require('puppeteer-core');
import baseJson from '../config/base.config';
import { Page, Browser } from 'puppeteer';
const debug = require('debug')('watch: core');

// component
import Media from '../component/media';

interface IOption {
    watchUrls: string[];
    headless?: boolean;
}

interface IConfig {
    headless?: boolean;
    chromePath: string;
    watchUrls: string[];
    showBrowser: boolean;
    browserWidth: number;
    browserHeight: number;
}

interface IState {
    pages: Page[];
    browser: Browser;
}

export default class Watch {
    private config: IConfig;
    private state: IState;
    private components: any[];
    constructor(option: IOption) {
        this.init(option);
    }

    async init(option: IOption) {
        this.config = {
            ... baseJson,
            ... option,
        };
        this.state = {
            pages: [],
            browser: await this.createBrowser(),
        };
        this.injectEnv();
        await this.run();
    }

    async createBrowser() {
        const browser = await puppeteer.launch({
            headless: !baseJson.showBrowser,
            executablePath: baseJson.chromePath,
            defaultViewport: {
                width: baseJson.browserWidth,
                height: baseJson.browserHeight,
            },
        });
        return browser;
    }

    async run() {
        const { watchUrls } = this.config;
        const { pages } = this.state;
        for (let i = 0; i < watchUrls.length; i ++) {
            const page = await this.state.browser.newPage();
            pages.push(page);
            await page.goto(watchUrls[i]);
        }

        await new Promise((resolve) => {
            setTimeout(() => {
                resolve();
            }, 100000);
        })
    }

    /**
     * 注入相关环境
     */
    async injectEnv() {
        const media = new Media({
            watchUrls: this.config.watchUrls,
        });
        media.on('recieveMsg', (data: any) => {
            debug(data);
        });
        await media.mount(this.state.browser);
    }

    async watchInit() {

    }
}