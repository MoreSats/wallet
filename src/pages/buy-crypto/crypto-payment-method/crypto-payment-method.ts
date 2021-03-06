import { Component } from '@angular/core';
import { NavController, NavParams, ViewController } from 'ionic-angular';
import * as _ from 'lodash';

// Providers
import { BuyCryptoProvider } from '../../../providers/buy-crypto/buy-crypto';
import { Logger } from '../../../providers/logger/logger';
import { ThemeProvider } from '../../../providers/theme/theme';

// Pages
import { CryptoOrderSummaryPage } from '../../../pages/buy-crypto/crypto-order-summary/crypto-order-summary';
export interface PaymentMethod {
  label: any;
  method: string;
  imgSrc: string;
  supportedFiat: string[];
  enabled: boolean;
}
@Component({
  selector: 'page-crypto-payment-method',
  templateUrl: 'crypto-payment-method.html'
})
export class CryptoPaymentMethodPage {
  public methods: { [key: string]: PaymentMethod };
  public methodSelected: string;
  public paymentRequest;
  public useAsModal: boolean;
  public isIOS: boolean;
  private coin: string;
  private currency: string;

  constructor(
    private logger: Logger,
    private navParams: NavParams,
    private navCtrl: NavController,
    private viewCtrl: ViewController,
    private buyCryptoProvider: BuyCryptoProvider,
    public themeProvider: ThemeProvider
  ) {
    this.coin = this.navParams.data.coin;
    this.currency = this.navParams.data.currency;
    this.methods = this.buyCryptoProvider.paymentMethodsAvailable;
  }

  ionViewDidLoad() {
    this.logger.info('Loaded: CryptoPaymentMethodPage');
    this.methods = _.pickBy(this.methods, m => {
      return m.enabled && m.supportedFiat.includes(this.currency);
    });
  }

  ionViewWillEnter() {
    this.useAsModal = this.navParams.data.useAsModal;
    if (!this.methodSelected)
      this.methodSelected = this.navParams.data.paymentMethod || 'sepaBankTransfer';
  }

  public goToOrderSummary(): void {
    const params = {
      coin: this.coin,
      currency: this.currency,
      network: this.navParams.data.network,
      walletId: this.navParams.data.walletId,
      paymentMethod: this.methods[this.methodSelected],
      amount: this.navParams.data.amount
    };
    this.navCtrl.push(CryptoOrderSummaryPage, params);
  }

  public close() {
    this.viewCtrl.dismiss();
  }

  public save() {
    if (!this.useAsModal || !this.methodSelected) return;
    this.viewCtrl.dismiss({ paymentMethod: this.methods[this.methodSelected] });
  }
}
