// ==UserScript==
// @name         Backpack.tf - Extra Links
// @author       Oddity
// @namespace    https://github.com/Oddity100
// @version      1.0.7
// @description  A script to provide extra links for backpack.tf
// @include      /^https?:\/\/backpack\.tf\/.*
// @downloadURL  https://github.com/Oddity100/bptf-extra-links/raw/main/bptf-extra-links.user.js
// @require      https://code.jquery.com/jquery-3.5.1.slim.min.js
// @run-at       document-end
// ==/UserScript==

(function () {
  "use strict";

  // Always make sure that the page is fully loaded
  if (document.readyState === "complete") {
    onLoad();
  } else {
    window.addEventListener("load", onLoad);
  }

  // Handle our control flow for different pages here
  function onLoad() {
    const pageURL = window.location.pathname;

    // Lazy switch statement (I know...)
    if (pageURL.includes("/stats/")) {
      injectCSS(css.bptf);
      addExtraButtons();
    }
  }

  const css = {
    bptf: `
        .fieldset {
            padding: revert!important;
            margin: revert!important;
            border: 1px solid silver!important;
            display: flex;
            align-items: center;
            width: fit-content;
        }
        .fieldset > legend{
            width: revert!important;
            border-bottom: 0!important;
            margin-bottom: revert!important;
            font-size: 1.5rem;
        }
        .fieldset span {
            color: #B45309;
        }
        .fieldset legend{
            font-weight: 500;
        }

        .li-options a {
            display: flex!important;
            align-items: center;
            justify-content: flex-start;
        }
        .li-options svg{
            width: 1.25em;
            height: 1.25em;
            margin-right: 3px;
        }
        .li-options path {
            fill: #333;
        }
        .add > div {
            display: flex; 
            flex-direction: column; 
            align-items: center; 
            justify-content: center; 
            cursor:pointer; 
            margin-top: 0;
        }

        .reload {
            pointer-events: none;
        }
        .reload button{
            pointer-events:all;
        }

        @media (max-width: 958.999px){
            .dropdown-menu path {
                fill: #888!important;
            }
        }
    `,
  };

  // Stock item def index mappings
  const stockMap = new Map();
  stockMap
    .set("0", "190") // Bat
    .set("1", "191") // Bottle
    .set("2", "192") // Fireaxe
    .set("3", "193") // Club
    .set("4", "194") // Knife
    .set("5", "195") // Fists
    .set("6", "196") // Shovel
    .set("7", "197") // Wrench
    .set("8", "198") // Bonesaw
    .set("9", "199") // Shotgun - Engineer (Primary)
    .set("10", "199") // Shotgun - Soldier
    .set("11", "199") // Shotgun - Heavy
    .set("12", "199") // Shotgun - Pyro
    .set("13", "200") // Scattergun
    .set("14", "201") // Sniper Rifle
    .set("15", "202") // Minigun
    .set("16", "203") // SMG
    .set("17", "204") // Syringe Gun
    .set("18", "205") // Rocket Launcher
    .set("19", "206") // Grenade Launcher
    .set("20", "207") // Stickybomb Launcher
    .set("21", "208") // Flamethrower
    .set("22", "209") // Pistol - Engineer
    .set("23", "209") // Pistol - Scout
    .set("24", "210") // Revolver
    .set("25", "737") // Construction PDA
    .set("29", "211") // Medigun
    .set("30", "212") // Invis Watch
    .set("735", "736"); // Sapper

  // Fetch an item's SKU given the item's attributes
  function itemLookup(itemElement) {
    let item = $(itemElement);

    let tempDefIndex = item.attr("data-defindex");
    let itemName = item.attr("data-original-title");
    let itemDefIndex = stockMap.has(tempDefIndex)
      ? stockMap.get(tempDefIndex)
      : tempDefIndex;

    let itemQuality = item.attr("data-quality");
    let isUncraftable = item.attr("data-craftable") !== "1";
    let itemEffectID = item.attr("data-effect_id");

    let itemSkinInfo = item.find(".item-icon");
    let itemWear, itemSkin;
    if (itemSkinInfo.length > 0) {
      itemSkinInfo = itemSkinInfo
        .css("background-image")
        .match(/warpaint\/[(?!_)\S]+_[0-9]+_[0-9]+_[0-9]+\.png/g);
      if (itemSkinInfo !== null) {
        itemSkin = itemSkinInfo[0].split("_")[1];
        itemWear = itemSkinInfo[0].split("_")[2];
      }
    }

    let isStrange = item.attr("data-quality_elevated") === "11";
    let itemKillstreak = item.attr("data-ks_tier");
    let isFestivized = item.attr("data-original-title")
      ? item.attr("data-original-title").toLowerCase().indexOf("festivized") !==
        -1
      : false;
    let isAustralium = item.attr("data-australium") === "1";

    // Other item attributes
    let crateSeries = item.attr("data-crate");
    let itemTarget, itemOutput, itemOutputQuality;
    const priceIndex = item.attr("data-priceindex").split("-");
    if (priceIndex[0] !== "0") {
      switch (item.attr("data-base_name")) {
        case "Chemistry Set":
          // Only change defindex if it's a buy listing or it's the item on the stats page.
          // So it won't change anything if it's from someones inventory or a sell listing.
          if (!item.attr("data-original_id")) {
            if (itemName.includes("Festive")) itemDefIndex = "20007";
            else if (itemName.includes("Collector's")) itemDefIndex = "20006";
            // Unsure about this one couldn't find any items might be unused.
            else if (itemName.includes("Strange")) itemDefIndex = "20008";
            // Assume all strangifier's are series 2 which they are definetly not :(
            // Used series 2 since it's the one with the biggest volume (Don't quote me on that).
            // Available defindexes; Series 1: 20000, Series 1 Rare: 20001, Series 2: 20005, Series 3: 20009.
            else if (itemName.includes("Strangifier")) itemDefIndex = "20005";
          }
        case "Fabricator":
          [itemOutput, itemOutputQuality, itemTarget] = priceIndex;
          break;
        case "Kit":
          itemTarget = priceIndex[1];
          break;
        case "Strangifier":
        case "Unusualifier":
          itemTarget = priceIndex[0];
      }
    }
    if (itemDefIndex == "9536") {
      itemDefIndex =
        (Math.floor(itemSkin / 100) % 2 === 0 ? "17" : "16") + itemSkin;
    }
    // Get the full item SKU, and be sure to remove any pesky whitespaces
    let itemSKU = `${itemDefIndex};\
      ${itemQuality}\
      ${itemEffectID ? `;u${itemEffectID}` : ""}\    
      ${isAustralium ? ";australium" : ""}\
      ${isUncraftable ? ";uncraftable" : ""}\
      ${itemSkinInfo ? `;w${itemWear};pk${itemSkin}` : ""}\
      ${isStrange ? ";strange" : ""}\
      ${itemKillstreak ? `;kt-${itemKillstreak}` : ""}\
      ${itemTarget ? `;td-${itemTarget}` : ""}\
      ${isFestivized ? ";festive" : ""}\
      ${crateSeries ? `;c${crateSeries}` : ""}\
      ${itemOutput ? `;od-${itemOutput}` : ""}\
      ${itemOutputQuality ? `;oq-${itemOutputQuality}` : ""}`;

    return itemSKU.replace(/\s/g, "");
  }

  function getManncostoreLink(itemElement) {
    let item = $(itemElement);

    let itemName = $(".stats-header-title").text().trim();

    let isUnusual = item.attr("data-quality") === "5";

    if (isUnusual) {
      let effectName = item.attr("data-effect_name");

      if (itemName.includes("Strange")) {
        itemName = itemName
          .replace("Strange ", "")
          .replace(effectName, effectName + " Strange Unusual");
      } else {
        itemName = itemName.replace(effectName, effectName + " Unusual");
      }
    }

    const itemNameWithoutSymbols = itemName
      .replace(/ /g, "-")
      .replace(/[^a-zA-Z0-9-]/g, "")
      .toLowerCase();

    const offerUrl = `https://mannco.store/item/440-${itemNameWithoutSymbols}`;
    return offerUrl;
  }

  // Adds a link to the prices.tf page for an item
  function addExtraButtons() {
    var itemElement = $(".item")[0];

    const sku = itemLookup(itemElement);

    const pricetfLink = `https://prices.tf/items/${sku}`;
    const manncostoreLink = getManncostoreLink(itemElement);

    $(".price-boxes").append(
      `
      <fieldset class="fieldset">
        <legend>Extra links</legend>

        <a class="price-box context add" target="_blank" data-tip="top" href=${pricetfLink}>
          <img src="https://prices.tf/favicon.ico" alt="pricestf">
          <div class="text">
              <div class="value" style="font-size: 14px;">Prices.tf</div>
          </div>
        </a>

        <a class="price-box add" target="_blank" href=${manncostoreLink}>
          <img src="https://mannco.store/statics/img/favicons/favicon.ico" alt="manncostore">
          <div class="text">
              <div class="value" style="font-size: 14px;">Mannco.store</div>
          </div>
        </a>
      </fieldset>`
    );
  }

  function injectCSS(css) {
    $(document).find("head").append(`<style>${css}</style>`);
  }
})();
