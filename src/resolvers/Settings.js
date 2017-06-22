'use strict';

let Promise = require('promise');
let azureTableService = require('../storageClients/AzureTableStorageManager');
let postgresMessageService = require('../postgresClients/PostgresLocationManager');

module.exports = {
    sites(args, res){ // eslint-disable-line no-unused-vars
        const startTime = Date.now();
        const siteId = args.siteId;
        return new Promise((resolve, reject) => {
            azureTableService.GetSiteDefinition(siteId,
                    (error, results) => {
                        if(error){
                            let errorMsg = `Internal location server error: [${JSON.stringify(error)}]`;
                            reject(errorMsg);
                        }else{
                            let siteCollection = Object.assign({}, {runTime: Date.now() - startTime, sites: results});

                            resolve(siteCollection);
                        }
                    });
        });
    },
    createOrReplaceSite(args, res){
        const siteDefinition = args.input;
        const siteType = siteDefinition.siteType;

        return new Promise((resolve, reject) => {
            azureTableService.InsertOrReplaceSiteDefinition(siteDefinition,
                    (error, result) => {
                        if(error){
                            let errorMsg = `Internal location server error: [${JSON.stringify(error)}]`;
                            reject(errorMsg);
                        }else{
                            /*
                            Only thing worth adding is that you’ll need to write the keyword entries into Cassandra from
                            the create site resolver function. Check out some the storageClient examples on how we’re doing
                            storage writes for Postgres and Azure table as examples. You can use Datastax node-js driver to
                             manage the communication between graphql and Cassandra https://github.com/datastax/nodejs-driver .
                             Also, the input type SiteDefinition will now accept an additional parameter called siteType.
                             You should only invoke the topic persistence step if that attribute is provided, as this will only be
                             provided when the deployment script invokes this service.
                            The Admin interface will never define this attribute, as its intent is to
                            infer which keywords to pre-populate the site with.
                            */
                            if(siteType && siteType.length > 0){
                               /*
                               Get data from blob storage but just for the one that is associated with the siteType!
                               accept the siteType input parameter and reference all topics for the input {type} from blob storage.
                               Store data into cassandra tables - Push one record in the Topics table in Cassandra
                               for each topic sourced from our blob storage container.
                               */


                            }

                            resolve(result && result.length > 0 ? result[0] : {});
                        }
                    });
        });
    },
    modifyFacebookPages(args, res){ // eslint-disable-line no-unused-vars
        const startTime = Date.now();
        const inputDefinition = args.input;
        const fbPages = inputDefinition.pages.map(page => Object.assign({}, page, {PartitionKey: {'_': inputDefinition.site}, RowKey: {'_': page.RowKey}}));

        return new Promise((resolve, reject) => {
            azureTableService.ModifyFacebookPages(inputDefinition.site, fbPages, azureTableService.AZURE_TABLE_BATCH_ACTIONS.INSERT_OR_MODIFY,
                    (error, results) => {
                        if(error){
                            let errorMsg = `Internal location server error: [${JSON.stringify(error)}]`;
                            reject(errorMsg);
                        }else{
                            let acctCollection = Object.assign({}, {runTime: Date.now() - startTime, pages: results});

                            resolve(acctCollection);
                        }
                    });
        });
    },
    modifyTrustedTwitterAccounts(args, res){ // eslint-disable-line no-unused-vars
        const startTime = Date.now();
        const inputDefinition = args.input;
        console.log(inputDefinition);
        console.log('Modifying collection');

        const trustedAccts = inputDefinition.accounts.map(page => Object.assign({}, page, {PartitionKey: {'_': inputDefinition.site}, RowKey: {'_': page.RowKey}}));

        console.log(trustedAccts);
        return new Promise((resolve, reject) => {
            azureTableService.ModifyTrustedTwitterAccounts(inputDefinition.site, trustedAccts, azureTableService.AZURE_TABLE_BATCH_ACTIONS.INSERT_OR_MODIFY,
                    (error, results) => {
                        if(error){
                            let errorMsg = `Internal location server error: [${JSON.stringify(error)}]`;
                            reject(errorMsg);
                        }else{
                            let acctCollection = Object.assign({}, {runTime: Date.now() - startTime, accounts: results});

                            resolve(acctCollection);
                        }
                    });
        });
    },
    removeFacebookPages(args, res){ // eslint-disable-line no-unused-vars
        const startTime = Date.now();
        const inputDefinition = args.input;
        const fbPages = inputDefinition.pages.map(page => Object.assign({}, page, {PartitionKey: {'_': inputDefinition.site}, RowKey: {'_': page.RowKey}}));

        return new Promise((resolve, reject) => {
            azureTableService.ModifyFacebookPages(inputDefinition.site, fbPages, azureTableService.AZURE_TABLE_BATCH_ACTIONS.DELETE,
                    (error, results) => {
                        if(error){
                            let errorMsg = `Internal location server error: [${JSON.stringify(error)}]`;
                            reject(errorMsg);
                        }else{
                            let acctCollection = Object.assign({}, {runTime: Date.now() - startTime, pages: results});

                            resolve(acctCollection);
                        }
                    });
        });
    },
    removeTrustedTwitterAccounts(args, res){ // eslint-disable-line no-unused-vars
        const startTime = Date.now();
        const inputDefinition = args.input;
        const trustedAccts = inputDefinition.accounts.map(page => Object.assign({}, page, {PartitionKey: {'_': inputDefinition.site}, RowKey: {'_': page.RowKey}}));

        return new Promise((resolve, reject) => {
            azureTableService.ModifyTrustedTwitterAccounts(inputDefinition.site, trustedAccts, azureTableService.AZURE_TABLE_BATCH_ACTIONS.DELETE,
                    (error, results) => {
                        if(error){
                            let errorMsg = `Internal location server error: [${JSON.stringify(error)}]`;
                            reject(errorMsg);
                        }else{
                            let acctCollection = Object.assign({}, {runTime: Date.now() - startTime, accounts: results});

                            resolve(acctCollection);
                        }
                    });
        });
    },
    modifyTwitterAccounts(args, res){ // eslint-disable-line no-unused-vars
        const startTime = Date.now();
        const twitterAccountDefintions = args.input;
        const twitterAccounts = twitterAccountDefintions.accounts.map(account => Object.assign({}, account, {PartitionKey: {'_': twitterAccountDefintions.site}, RowKey: {'_': account.accountName}}));

        return new Promise((resolve, reject) => {
            azureTableService.ModifyTwitterAccounts(twitterAccountDefintions.site, twitterAccounts, azureTableService.AZURE_TABLE_BATCH_ACTIONS.INSERT_OR_MODIFY,
                    (error, results) => {
                        if(error){
                            let errorMsg = `Internal location server error: [${JSON.stringify(error)}]`;
                            reject(errorMsg);
                        }else{
                            let acctCollection = Object.assign({}, {runTime: Date.now() - startTime, accounts: results});

                            resolve(acctCollection);
                        }
                    });
        });
    },
    removeTwitterAccounts(args, res){ // eslint-disable-line no-unused-vars
        const startTime = Date.now();
        const twitterAccountDefintions = args.input;
        const twitterAccounts = twitterAccountDefintions.accounts.map(account => Object.assign({}, account, {PartitionKey: {'_': twitterAccountDefintions.site}, RowKey: {'_': account.accountName}}));

        return new Promise((resolve, reject) => {
            azureTableService.ModifyTwitterAccounts(twitterAccountDefintions.site, twitterAccounts, azureTableService.AZURE_TABLE_BATCH_ACTIONS.DELETE,
                    (error, results) => {
                        if(error){
                            let errorMsg = `Internal location server error: [${JSON.stringify(error)}]`;
                            reject(errorMsg);
                        }else{
                            let acctCollection = Object.assign({}, {runTime: Date.now() - startTime, accounts: results});

                            resolve(acctCollection);
                        }
                    });
        });
    },
    twitterAccounts(args, res){ // eslint-disable-line no-unused-vars
        const startTime = Date.now();
        const siteId = args.siteId;
        return new Promise((resolve, reject) => {
            azureTableService.GetTwitterAccounts(siteId,
                    (error, results) => {
                        if(error){
                            let errorMsg = `Internal location server error: [${JSON.stringify(error)}]`;
                            reject(errorMsg);
                        }else{
                            let acctCollection = Object.assign({}, {runTime: Date.now() - startTime, accounts: results});

                            resolve(acctCollection);
                        }
                    });
        });
    },
    trustedTwitterAccounts(args, res){ // eslint-disable-line no-unused-vars
        const startTime = Date.now();
        const siteId = args.siteId;
        return new Promise((resolve, reject) => {
            azureTableService.GetTrustedTwitterAccounts(siteId,
                    (error, results) => {
                        if(error){
                            let errorMsg = `Internal location server error: [${JSON.stringify(error)}]`;
                            reject(errorMsg);
                        }else{
                            let collection = Object.assign({}, {runTime: Date.now() - startTime, accounts: results});

                            resolve(collection);
                        }
                    });
        });
    },
    facebookPages(args, res){ // eslint-disable-line no-unused-vars
        const startTime = Date.now();
        const siteId = args.siteId;
        return new Promise((resolve, reject) => {
            azureTableService.GetFacebookPages(siteId,
                    (error, results) => {
                        if(error){
                            let errorMsg = `Internal location server error: [${JSON.stringify(error)}]`;
                            reject(errorMsg);
                        }else{
                            let collection = Object.assign({}, {runTime: Date.now() - startTime, pages: results});

                            resolve(collection);
                        }
                    });
        });
    },
    facebookAnalytics(args, res) { // eslint-disable-line no-unused-vars
        const days = args.days;
        const site = args.siteId;
        return new Promise((resolve, reject) => {
            postgresMessageService.FetchFacebookAnalytics(site,days,
                    (error, results) => {
                        if(error){
                            let errorMsg = `Internal facebook analytics error: [${JSON.stringify(error)}]`;
                            reject(errorMsg);
                        }else{
                            let collection = Object.assign({}, {analytics: results});
                            resolve(collection);
                        }
                    });
        });
    },
    termBlacklist(args, res){ // eslint-disable-line no-unused-vars
        const startTime = Date.now();
        const siteId = args.siteId;
        return new Promise((resolve, reject) => {
            azureTableService.GetBlacklistTerms(siteId,
                    (error, results) => {
                        if(error){
                            let errorMsg = `Internal location server error: [${JSON.stringify(error)}]`;
                            reject(errorMsg);
                        }else{
                            let collection = Object.assign({}, {runTime: Date.now() - startTime, filters: results});

                            resolve(collection);
                        }
                    });
        });
    },
    modifyBlacklist(args, res){ // eslint-disable-line no-unused-vars
        const startTime = Date.now();
        const blacklistTermDefinitions = args.input;
        const blacklistTerms = blacklistTermDefinitions.terms.map(item => Object.assign({}, {PartitionKey: {'_': blacklistTermDefinitions.site}, RowKey: {'_': item.RowKey}, filteredTerms: JSON.stringify(item.filteredTerms), lang: item.lang}));

        return new Promise((resolve, reject) => {
            azureTableService.ModifyBlacklistTerms(blacklistTerms, blacklistTermDefinitions.site, azureTableService.AZURE_TABLE_BATCH_ACTIONS.INSERT_OR_MODIFY,
                    (error, results) => {
                        if(error){
                            const errorMsg = `Internal location server error: [${JSON.stringify(error)}]`;
                            reject(errorMsg);
                        }else{
                            const termCollection = Object.assign({}, {runTime: Date.now() - startTime, filters: results});
                            resolve(termCollection);
                        }
                    });
        });
    },
    removeBlacklist(args, res){ // eslint-disable-line no-unused-vars
        const startTime = Date.now();
        const blacklistTermDefinitions = args.input;
        const blacklistTerms = blacklistTermDefinitions.terms.map(item => Object.assign({}, item, {PartitionKey: {'_': blacklistTermDefinitions.site}, RowKey: {'_': item.RowKey}}));

        return new Promise((resolve, reject) => {
            azureTableService.ModifyBlacklistTerms(blacklistTerms, blacklistTermDefinitions.site, azureTableService.AZURE_TABLE_BATCH_ACTIONS.DELETE,
                    (error, results) => {
                        if(error){
                            let errorMsg = `Internal location server error: [${JSON.stringify(error)}]`;
                            reject(errorMsg);
                        }else{
                            const termCollection = Object.assign({}, {runTime: Date.now() - startTime, filters: results});
                            resolve(termCollection);
                        }
                    });
        });
    }
};
