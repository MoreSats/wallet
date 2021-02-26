import { Component } from '@angular/core';
import { NavParams, ViewController } from 'ionic-angular';

// Providers
import { Logger } from '../../../providers/logger/logger';
import { PersistenceProvider } from '../../../providers/persistence/persistence';

import * as _ from 'lodash';

@Component({
  selector: 'page-country-selector',
  templateUrl: 'country-selector.html'
})
export class CountrySelectorPage {
  public completeCountryList;
  public countryList;
  public commonCountriesList;
  public useAsModal;

  constructor(
    private logger: Logger,
    private viewCtrl: ViewController,
    private persistenceProvider: PersistenceProvider,
    private navParams: NavParams,
  ) {
    this.completeCountryList = [];
    this.countryList = [];
    this.commonCountriesList = [
      {
        name: 'Česko',
        phonePrefix: '+420',
        shortCode: 'CZ',
        threeLetterCode: 'CZE'
      },
      {
        name: 'Slovensko',
        phonePrefix: '+421',
        shortCode: 'SK',
        threeLetterCode: 'SVK'
      }
    ];

    this.persistenceProvider.getLastCountryUsed().then(lastUsedCountry => {
      if (
        lastUsedCountry &&
        _.isObject(lastUsedCountry) &&
        !this.commonCountriesList.map(c => c.threeLetterCode).includes(lastUsedCountry.threeLetterCode)
      ) {
        this.commonCountriesList.unshift(lastUsedCountry);
      }
    });
    this.completeCountryList = [];
  }

  ionViewDidLoad() {
    this.logger.info('Loaded: CountrySelectorPage');
  }

  ionViewWillEnter() {
    this.useAsModal = this.navParams.data.useAsModal;
  }

  public save(selectedCountry): void {
    this.persistenceProvider.setLastCountryUsed(selectedCountry);
    this.viewCtrl.dismiss({ selectedCountry });
  }

  public close() {
    this.viewCtrl.dismiss();
  }
}
