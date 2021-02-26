import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

// providers
import { ConfigProvider } from '../config/config';
import { HomeIntegrationsProvider } from '../home-integrations/home-integrations';
import { Logger } from '../logger/logger';

@Injectable()
export class BuyCryptoProvider {
  public paymentMethodsAvailable;
  public exchangeCoinsSupported: string[];
  public supportedFiat: string[];

  constructor(
    private configProvider: ConfigProvider,
    private homeIntegrationsProvider: HomeIntegrationsProvider,
    private logger: Logger,
    private translate: TranslateService,
  ) {
    this.logger.debug('BuyCrypto Provider initialized');

    this.exchangeCoinsSupported = ['btc'];
    this.supportedFiat = ['CZK', 'EUR'];
    this.paymentMethodsAvailable = {
      bankTransfer: {
        label: this.translate.instant('Local Bank Transfer'),
        method: 'bankTransfer',
        imgSrc: 'assets/img/buy-crypto/icon-bank.svg',
        supportedFiat: ['CZK'],
        countries: ['CZ'],
        enabled: true
      },
      sepaBankTransfer: {
        label: this.translate.instant('SEPA Bank Transfer'),
        method: 'sepaBankTransfer',
        imgSrc: 'assets/img/buy-crypto/icon-bank.svg',
        supportedFiat: this.supportedFiat,
        countries: ['CZ', 'SK'],
        enabled: true
      },
      debitCard: {
        label: this.translate.instant('Card'),
        method: 'debitCard',
        imgSrc: 'assets/img/buy-crypto/icon-debitcard.svg',
        supportedFiat: this.supportedFiat,
        countries: ['CZ', 'SK'],
        enabled: true
      }
    };
  }

  public register(): void {
    this.homeIntegrationsProvider.register({
      name: 'buycrypto',
      title: this.translate.instant('Buy Crypto'),
      icon: 'assets/img/icon-coins.svg',
      showIcon: true,
      logo: null,
      logoWidth: '110',
      background:
        'linear-gradient(to bottom,rgba(60, 63, 69, 1) 0,rgba(45, 47, 51, 1) 100%)',
      page: 'CryptoSettingsPage',
      show: !!this.configProvider.get().showIntegration['buycrypto'],
      type: 'exchange'
    });
  }

  public isPaymentMethodSupported(
    paymentMethod,
    country,
  ): boolean {
    return this.paymentMethodsAvailable[paymentMethod] && this.paymentMethodsAvailable[paymentMethod].countries.includes(country.shortCode);
  }

  public async getPaymentRequests(): Promise<any> {
    return {};
  }

  public getExchangeCoinsSupported(): string[] {
    return this.exchangeCoinsSupported;
  }
}
