const Discord = require("discord.js");
const client = new Discord.Client();
require("dotenv").config();
const axios = require("axios");
const cron = require("node-cron");

const districtListApi = `https://cdn-api.co-vin.in/api/v2/admin/location/districts/17`;
const districtApi = `https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/calendarByDistrict?district_id=`;
const formatDate = require("../messages/formatting/today");
const centerData = require("./formatting/centerData");
const fetch = require("../api/fetch");
let date = new Date();
let districtList;
let oldList = [];
let newList = [];
let updates = [];

//function that runs when the bot is ready
client.on("ready", async () => {
  console.log(`${client.user.tag} is ready`);

  //schedule task every 2 mins
  cron.schedule("*/2 * * * *", async () => {
    console.log("\n\nrunning script");

    //fetching district list
    try {
      districtList = await fetch(districtListApi, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:89.0) Gecko/20100101 Firefox/89.0",
        },
      });
      console.log("fetched district list");
      districtList = districtList.districts;
    } catch (e) {
      console.log(`${e.name} - auto : unable to fetch district list`);
    }

    //iterating through district list
    for (let i = 0; i < districtList.length; i++) {
      try {
        //fetching each districts availability
        let districtInfo = await axios.get(
          `${districtApi}${districtList[i].district_id}&date=${formatDate(
            date
          )}`,
          {
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:89.0) Gecko/20100101 Firefox/89.0",
            },
          }
        );
        console.log(`fetched centers from ${districtList[i].district_name}`);
        districtInfo.data.district = districtList[i].district_name;
        newList.push(districtInfo.data);
      } catch (e) {
        console.log(
          `${e.name} - auto : unabe to fetch district ${districtList[i].district_name}`
        );
      }
    }

    //finding if updates are needed
    //if old list and new list have different number of elements
    if (oldList.length !== newList.length) {
      updates = newList;
    }
    //if both old list and newlist are of the same length
    else {
      for (let i = 0; i < newList.length; i++)
        if (oldList[i] !== newList[i]) updates.push(newList[i]);
    }

    //printing only updated districts
    for (let i = 0; i < updates.length; i++) {
      await centerData(updates[i], client);
    }

    //updating old list
    oldList = newList;
    newList = [];
    updates = [];
  });
});
client.login(process.env.BOT_TOKEN);