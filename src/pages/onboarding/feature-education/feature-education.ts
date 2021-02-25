import {Component, ViewChild} from '@angular/core';
import {NavController, Slides} from 'ionic-angular';

// Providers
import {ActionSheetProvider} from '../../../providers/action-sheet/action-sheet';
import {ConfigProvider} from '../../../providers/config/config';
import {Logger} from '../../../providers/logger/logger';
import {PlatformProvider} from '../../../providers/platform/platform';
import {
  BwcErrorProvider, ErrorsProvider,
  OnGoingProcessProvider,
  ProfileProvider, PushNotificationsProvider,
  WalletProvider,
} from '../../../providers';

// Pages
import {ImportWalletPage} from '../../../pages/add/import-wallet/import-wallet';
import {SelectCurrencyPage} from '../../../pages/add/select-currency/select-currency';
import {LockMethodPage} from '../../../pages/onboarding/lock-method/lock-method';
import {RecoveryKeyPage} from "../recovery-key/recovery-key";
import {TranslateService} from "@ngx-translate/core";

@Component({
  selector: 'page-feature-education',
  templateUrl: 'feature-education.html'
})
export class FeatureEducationPage {
  @ViewChild('featureEducationSlides')
  featureEducationSlides: Slides;
  public isCordova: boolean;

  private pageMap = {
    SelectCurrencyPage,
    ImportWalletPage
  };
  private params = {
    isOnboardingFlow: true,
    isZeroState: true
  };

  constructor(
    public navCtrl: NavController,
    private logger: Logger,
    private actionSheetProvider: ActionSheetProvider,
    private configProvider: ConfigProvider,
    private profileProvider: ProfileProvider,
    private onGoingProcessProvider: OnGoingProcessProvider,
    private walletProvider: WalletProvider,
    private pushNotificationsProvider: PushNotificationsProvider,
    private translate: TranslateService,
    private bwcErrorProvider: BwcErrorProvider,
    private errorsProvider: ErrorsProvider,
    private platformProvider: PlatformProvider
  ) {
    this.isCordova = this.platformProvider.isCordova;
  }

  ionViewDidLoad() {
    this.logger.info('Loaded: FeatureEducationPage');
  }

  ionViewWillLoad() {
    this.featureEducationSlides.lockSwipeToPrev(true);
  }

  public slideChanged() {
    // Disable first bounce
    let currentIndex = this.featureEducationSlides.getActiveIndex();
    currentIndex == 0
      ? this.featureEducationSlides.lockSwipeToPrev(true)
      : this.featureEducationSlides.lockSwipeToPrev(false);
  }

  public createWallet(): void {
    this.onGoingProcessProvider.set('creatingWallet');
    this.profileProvider
        .createMultipleWallets(['btc'], [])
        .then(async wallets => {
          this.walletProvider.updateRemotePreferences(wallets);
          this.pushNotificationsProvider.updateSubscription(wallets);
          await new Promise(resolve => setTimeout(resolve, 1000));
          this.profileProvider.setNewWalletGroupOrder(
              wallets[0].credentials.keyId
          );
          this.endProcess(wallets[0].credentials.keyId);
        })
        .catch(e => {
          this.showError(e);
        });
  }

  private showError(err) {
    this.onGoingProcessProvider.clear();
    this.logger.error('Create: could not create wallet', err);
    const title = this.translate.instant('Error');
    err = this.bwcErrorProvider.msg(err);
    this.errorsProvider.showDefaultError(err, title);
  }

  private endProcess(keyId?: string) {
    this.onGoingProcessProvider.clear();
    this.navCtrl.push(RecoveryKeyPage, {
      keyId,
      isOnboardingFlow: true
    });
  }

  public goToNextPage(nextViewName: string): void {
    const config = this.configProvider.get();
    if ((config.lock && config.lock.method) || !this.isCordova)
      this.navCtrl.push(this.pageMap[nextViewName], this.params);
    else this.showInfoSheet(nextViewName);
  }

  private showInfoSheet(nextViewName: string): void {
    const infoSheet = this.actionSheetProvider.createInfoSheet('protect-money');
    infoSheet.present();
    infoSheet.onDidDismiss(option => {
      if (option) this.goToLockMethodPage(nextViewName);
    });
  }

  private goToLockMethodPage(name: string): void {
    let nextView = {
      name,
      params: this.params
    };
    this.navCtrl.push(LockMethodPage, {nextView});
  }
}
