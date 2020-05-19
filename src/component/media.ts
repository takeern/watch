import { Browser, Page } from 'puppeteer';
import { EventEmitter } from 'events';
const event = require('events'); 
const debug = require('debug')('watch: media');

interface IOption {
    watchUrls: string[];
}

interface IMsg {
    id: string;
    timestamp: number;
    key: string;
    value: string;
}

interface IPlayer {
    [propName: string]: {
        originUrl?: {
            timestamp: number;
            value: string;
        };
        kFrameUrl?: {
            timestamp: number;
            value: string;
        };
    }
}

export default class Media {
    private browser: Browser;
    private page: Page;
    private player: IPlayer;
    private event: EventEmitter;
    constructor(private option: IOption) {
        debug('Media watch: start')
        this.player = {};
        this.event = new event.EventEmitter();
    }

    public async mount(bws: Browser) {
        this.browser = bws;
        this.page = await bws.newPage();
        this.page.on('metrics', async (msg: any) => {
            this.onRecieveMsg(JSON.parse(msg.title));
        });
        await this.page.goto('chrome://media-internals');
    }

    public on(event: string, callback: (...args: any[]) => void) {
        this.event.on(event, callback);
    }

    private onRecieveMsg(msg: IMsg) {
        const { id, timestamp, key, value } = msg;
        switch (key) {
            case 'origin_url':
                if (this.player[id]) {
                    debug(`[Error]: id:${id} player has created`);
                    return;
                }

                this.player[id] = {
                    originUrl: {
                        timestamp,
                        value,
                    },
                };
                return;
            case 'kFrameUrl':
                if (!this.player[id]) {
                    debug(`[Error]: id: ${id} player isn't created`);
                    return;
                }
                this.player[id].kFrameUrl = {
                    timestamp,
                    value,
                }
                return;
            default:
                if (!this.player[id]) {
                    debug(`[Error]: id: ${id} player isn't created`);
                    return;
                }
                break;
        }
        const kFrameUrl = this.player[id].kFrameUrl.value;
        if (this.option.watchUrls.find(i => i === kFrameUrl)) {
            this.event.emit('recieveMsg', {
                ...msg,
                url: kFrameUrl,
            });
        }
    }

}