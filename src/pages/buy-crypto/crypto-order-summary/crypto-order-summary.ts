import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ModalController, NavController, NavParams } from 'ionic-angular';
import * as _ from 'lodash';
import env from '../../../environments';

// Providers
import { ActionSheetProvider } from '../../../providers/action-sheet/action-sheet';
import { BuyCryptoProvider } from '../../../providers/buy-crypto/buy-crypto';
import { ErrorsProvider } from '../../../providers/errors/errors';
import { Logger } from '../../../providers/logger/logger';
import { OnGoingProcessProvider } from '../../../providers/on-going-process/on-going-process';
import { PersistenceProvider } from '../../../providers/persistence/persistence';
import { ProfileProvider } from '../../../providers/profile/profile';
import { WalletProvider } from '../../../providers/wallet/wallet';

// Pages
import { SelectCurrencyPage } from '../../../pages/add/select-currency/select-currency';
import { CountrySelectorPage } from '../../../pages/buy-crypto/country-selector/country-selector';
import { CryptoCoinSelectorPage } from '../../../pages/buy-crypto/crypto-coin-selector/crypto-coin-selector';
import { CryptoOffersPage } from '../../../pages/buy-crypto/crypto-offers/crypto-offers';
import { CryptoPaymentMethodPage } from '../../../pages/buy-crypto/crypto-payment-method/crypto-payment-method';
import { AmountPage } from '../../../pages/send/amount/amount';
import { WalletDetailsPage } from '../../wallet-details/wallet-details';

@Component({
  selector: 'page-crypto-order-summary',
  templateUrl: 'crypto-order-summary.html'
})
export class CryptoOrderSummaryPage {
  private wallets: any[];
  private readonly supportedCoins: string[];
  public wallet: any;
  public walletId: any;
  public coin: string;
  public paymentMethod: any;
  public country: string;
  public currency: string;
  public amount: any;
  public address: string;
  public countryList: any[] = [];
  public selectedCountry;

  constructor(
    private logger: Logger,
    private navParams: NavParams,
    private modalCtrl: ModalController,
    private navCtrl: NavController,
    private persistenceProvider: PersistenceProvider,
    private profileProvider: ProfileProvider,
    private walletProvider: WalletProvider,
    private buyCryptoProvider: BuyCryptoProvider,
    private errorsProvider: ErrorsProvider,
    private actionSheetProvider: ActionSheetProvider,
    private translate: TranslateService,
    private onGoingProcessProvider: OnGoingProcessProvider,
  ) {
    this.amount = this.navParams.data.amount;
    this.currency = this.navParams.data.currency;
    this.coin = this.navParams.data.coin;
    this.supportedCoins = this.buyCryptoProvider.exchangeCoinsSupported;
  }

  ionViewDidLoad() {
    this.logger.info('Loaded: CryptoOrderSummaryPage');
    this.onGoingProcessProvider.set(
      this.translate.instant('Setting parameters...')
    );

    this.persistenceProvider
      .getLastCountryUsed()
      .then(async lastUsedCountry => {
        if (lastUsedCountry && _.isObject(lastUsedCountry)) {
          this.selectedCountry = lastUsedCountry;
        } else {
          this.selectedCountry = {
            name: 'Česko',
            phonePrefix: '+420',
            shortCode: 'CZ',
            threeLetterCode: 'CZE'
          };
        }
        this.onGoingProcessProvider.clear();

        if (this.navParams.data.walletId) {
          this.setWallet(this.navParams.data.walletId);
        } else {
          this.selectFirstAvailableWallet();
        }

        if (this.navParams.data.paymentMethod) {
          this.paymentMethod = this.navParams.data.paymentMethod;
        } else {
          this.logger.debug('No payment method selected. Setting to default.');
          this.setDefaultPaymentMethod();
        }
      });
  }

  private selectFirstAvailableWallet() {
    const supportedCoins = this.buyCryptoProvider.getExchangeCoinsSupported();
    // Select first available wallet
    this.wallets = this.profileProvider.getWallets({
      network: env.name == 'development' ? null : 'livenet',
      onlyComplete: true,
      coin:
        this.coin && supportedCoins.includes(this.coin)
          ? this.coin
          : supportedCoins,
      backedUp: true
    });
    if (this.wallets[0]) {
      this.logger.debug(
        'Setting wallet to deposit funds: ' +
          this.wallets[0].credentials.walletId
      );
      this.setWallet(this.wallets[0].credentials.walletId);
    } else {
      this.logger.debug('No wallets available to deposit funds.');
      const walletsGroups = this.profileProvider.orderedWalletsByGroup;

      this.errorsProvider.showNoWalletError(
        this.coin ? this.coin.toUpperCase() : null,
        option => {
          // Single seed case:
          let data;
          if (walletsGroups.length == 1 && walletsGroups[0][0]) {
            data = {
              keyId: walletsGroups[0][0].credentials.keyId
            };
          }

          if (option) {
            this.navCtrl.push(SelectCurrencyPage, data);
          }
        }
      );
    }
  }

  private setWallet(walletId): void {
    this.walletId = walletId;
    this.wallet = this.profileProvider.getWallet(this.walletId);
    this.coin = this.wallet.coin;
    if (this.isCoinSupportedByCountry()) {
      this.walletProvider.getAddress(this.wallet, false).then(addr => {
        this.address = addr;
      });
    } else {
      this.showCoinAndCountryError();
    }
  }

  public openAmountModal() {
    let modal = this.modalCtrl.create(
      AmountPage,
      {
        fromBuyCrypto: true,
        walletId: this.walletId,
        coin: this.coin,
        useAsModal: true,
        currency: this.currency
      },
      {
        showBackdrop: true,
        enableBackdropDismiss: true
      }
    );
    modal.present();
    modal.onDidDismiss(data => {
      if (data) {
        this.amount = data.fiatAmount;
        this.currency = data.currency;
        this.checkPaymentMethod();
      }
    });
  }

  public openCryptoCoinSelectorModal() {
    let modal = this.modalCtrl.create(
      CryptoCoinSelectorPage,
      {
        useAsModal: true,
        country: this.selectedCountry,
      },
      {
        showBackdrop: true,
        enableBackdropDismiss: true
      }
    );
    modal.present();
    modal.onDidDismiss(data => {
      if (data) {
        this.coin = data.coin;
        this.setWallet(data.walletId);
        this.checkPaymentMethod();
      }
    });
  }

  public openCountrySelectorModal() {
    let modal = this.modalCtrl.create(
      CountrySelectorPage,
      {
        countryList: this.countryList,
        useAsModal: true
      },
      {
        showBackdrop: true,
        enableBackdropDismiss: true
      }
    );
    modal.present();
    modal.onDidDismiss(data => {
      if (data) {
        this.selectedCountry = data.selectedCountry;
        if (this.isCoinSupportedByCountry()) {
          this.checkPaymentMethod();
        } else {
          this.showCoinAndCountryError();
        }
      }
    });
  }

  private setDefaultPaymentMethod() {
    if (
      this.buyCryptoProvider.isPaymentMethodSupported(
        this.buyCryptoProvider.paymentMethodsAvailable.bankTransfer,
        this.selectedCountry,
      )
    ) {
      this.paymentMethod = this.buyCryptoProvider.paymentMethodsAvailable.bankTransfer;
    } else {
      this.paymentMethod = this.buyCryptoProvider.paymentMethodsAvailable.sepaBankTransfer;
    }
  }

  private checkPaymentMethod() {
    if (!this.paymentMethod || !this.selectedCountry || !this.currency) return;
    if (!this.paymentMethod.supportedFiat.includes(this.currency)) {
      this.setDefaultPaymentMethod();
      this.showPaymentMethodWarning('currency');
    }
    if (
      this.buyCryptoProvider.isPaymentMethodSupported(
        this.paymentMethod.method,
        this.selectedCountry
      )
    ) {
      this.logger.debug(
        `Payment methods ${this.paymentMethod.method} supported for ${this.selectedCountry.shortCode}`
      );
      return;
    } else {
      this.logger.debug(
          `Payment methods ${this.paymentMethod.method} not supported for ${this.selectedCountry.shortCode}. Show warning.`
      );
      this.setDefaultPaymentMethod();
      this.showPaymentMethodWarning('country');
    }
  }

  private isCoinSupportedByCountry(): boolean {
    if (
      !_.includes(
        this.supportedCoins,
        this.coin
      ) && ['CZ','SK'].includes(this.selectedCountry.shortCode)
    ) {
      this.logger.debug(
        `Selected coin: ${this.coin} is not currently available for selected country: ${this.selectedCountry.name}. Show warning.`
      );
      return false;
    } else {
      return true;
    }
  }

  private showCoinAndCountryError() {
    if (!this.coin) return;
    const title = this.translate.instant('Error');
    const subtitle = this.translate.instant(
      `The selected coin (${this.coin.toUpperCase()}) is not currently available to buy in your country.`
    );
    this.errorsProvider.showDefaultError(subtitle, title);
    this.wallet = null;
    this.address = null;
    this.coin = null;
  }

  private showPaymentMethodWarning(reason: string): void {
    const infoSheet = this.actionSheetProvider.createInfoSheet(
      'payment-method-changed',
      {
        coin: this.coin,
        currency: this.currency,
        reason
      }
    );
    infoSheet.present();
  }

  public openCryptoPaymentMethodModal() {
    if (!this.coin) {
      const title = this.translate.instant('Error');
      const subtitle = this.translate.instant(
        `You must first select a wallet to deposit.`
      );
      this.errorsProvider.showDefaultError(subtitle, title);
      return;
    }
    let modal = this.modalCtrl.create(
      CryptoPaymentMethodPage,
      {
        paymentMethod: this.paymentMethod.method,
        useAsModal: true,
        coin: this.coin,
        selectedCountry: this.selectedCountry,
        currency: this.currency,
      },
      {
        showBackdrop: true,
        enableBackdropDismiss: true
      }
    );
    modal.present();
    modal.onDidDismiss(data => {
      if (data) {
        this.paymentMethod = data.paymentMethod;
      }
    });
  }

  public goToCryptoOffersPage() {
    const params = {
      amount: this.amount,
      currency: this.currency,
      paymentMethod: this.paymentMethod,
      coin: this.coin,
      walletId: this.walletId,
      selectedCountry: this.selectedCountry,
    };
    this.navCtrl.push(CryptoOffersPage, params);
  }

  public getDigitsInfo(currency: string) {
    if (!this.coin || this.coin.toUpperCase() === currency) return '';
    else return '1.2-2';
  }

  public goToCoinSelector(): void {
    this.navCtrl.push(CryptoCoinSelectorPage, {
      country: this.selectedCountry,
    });
  }

  public cancelOrder() {
    this.navCtrl.popToRoot().then(_ => {
      if (
        this.wallet &&
        this.wallet.credentials.walletId == this.navParams.data.walletId
      ) {
        this.navCtrl.push(WalletDetailsPage, {
          walletId: this.navParams.data.walletId
        });
      }
    });
  }
}
