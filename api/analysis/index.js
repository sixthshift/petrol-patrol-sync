const _ = require('lodash');
const axios = require('axios');
const cheerio = require('cheerio');
const moment = require('moment');
const utils = require('../../util/utils');

module.exports = class Analysis {

    constructor() {
        this.baseURLs = [
            'https://www.mynrma.com.au/membership/my-nrma-app/fuel-resources/fuel-report-',
            'https://www.mynrma.com.au/membership/my-nrma-app/fuel-resources/weekly-fuel-report/',
        ];
        this.mondays = [
            moment().startOf('isoWeek').subtract(1, 'weeks'),
            moment().startOf('isoWeek'),
        ];
        this.formats = [
            'D-M-Y',
            'D-MM-Y',
            'D-MMM-Y',
            'D-MMMM-Y',
            'DD-M-Y',
            'DD-MM-Y',
            'DD-MMM-Y',
            'DD-MMMM-Y',
            'D-M-YY',
            'D-MM-YY',
            'D-MMM-YY',
            'D-MMMM-YY',
            'DD-M-YY',
            'DD-MM-YY',
            'DD-MMM-YY',
            'DD-MMMM-YY',
            'D-M-YYYY',
            'D-MM-YYYY',
            'D-MMM-YYYY',
            'D-MMMM-YYYY',
            'DD-M-YYYY',
            'DD-MM-YYYY',
            'DD-MMM-YYYY',
            'DD-MMMM-YYYY',
        ];
        this.urls = _(utils.product(this.baseURLs, this.mondays, this.formats))
            .sortBy('1')
            .map((tuple) => (
                {
                    timestamp: tuple[1].unix(),
                    url: tuple[0] + tuple[1].format(tuple[2]),
                }
            ))
            .uniqWith(_.isEqual)
            .value();
        this.data = null;
    }

    isInitialised() {
        return (!_.isEmpty(this.data));
    }

    async init() {
        if (!_.isEmpty(this.urls)) {
            const { timestamp, url } = this.urls.pop();
            const config = {
                method: 'get',
                url: url,
            };
            try {
                const response = await axios(config);
                const $ = cheerio.load(response.data);
                const parsedHtml = _($('.rich-text-editor p'))
                    .map((node) => (_.split($(node).text(), '\n')))
                    .flatten()
                    .filter((segment) => (!_.isEmpty(segment) && !_.includes(segment.toLowerCase(), 'nrma')))
                    .join('\n\n');
                this.data = {
                    data: parsedHtml,
                    timestamp: timestamp,
                };
                return {
                    status: true,
                    response: 'Analysis successfully fetched',
                };
            }
            catch (err) {
                // This could mean that the url format is incorrect, try the next one
                return this.init();
            }
        } else {
            // None of the formats are valid
            return {
                status: false,
                response: 'No valid url formats found',
            };
        }
    }

    fetch() {
        if (this.isInitialised()) {
            return this.data;
        } else {
            return {
                data: null,
                timestamp: null,
            }
        }
    }
}