/**
 * Created with JetBrains WebStorm.
 * User: ewkoenw
 * Date: 9/2/13
 * Time: 6:24 PM
 * To change this template use File | Settings | File Templates.
 */
var PayrollConstants = {
    weekdays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    paySchedule: ['Weekly']
};

var payrollModule = angular.module('payroll', ['ui.bootstrap', 'ngGrid']);

payrollModule.controller('PayrollController',function($scope, $dialog, DataService) {
    $scope.application = {
        payDays: 4,
        holidays: { sun: false, mon: false, tue: false, wed: false, thu: false, fri: false, sat: false }
    };

    DataService.init();

    $scope.generalSetupDialogOptions = {
        backdrop: true,
        keyboard: true,
        backdropClick: false,
        templateUrl: 'general-setup.html',
        controller: 'GeneralSetupController'
    };

    $scope.showGeneralSetup = function() {
        var d = $dialog.dialog($scope.generalSetupDialogOptions);
        d.open();
    };

    $scope.socialSecurityDialogOptions = {
        backdrop: true,
        keyboard: true,
        backdropClick: false,
        dialogClass: 'modal ss-dialog',
        templateUrl: 'social-security.html',
        controller: 'SocialSecurityController'
    };

    $scope.showSocialSecurity = function() {
        var d = $dialog.dialog($scope.socialSecurityDialogOptions);
        d.open();
    }

    $scope.withholdingTypesDialogOptions = {
        backdrop: true,
        keyboard: true,
        backdropClick: false,
        dialogClass: 'modal wht-dialog',
        templateUrl: 'withholding-types.html',
        controller: 'WithholdingTypesController'
    };

    $scope.showWithholdingTypes = function() {
        var d = $dialog.dialog($scope.withholdingTypesDialogOptions);
        d.open();
    }

    $scope.medicareDialogOptions = {
        backdrop: true,
        keyboard: true,
        backdropClick: false,
        dialogClass: 'modal medicare-dialog',
        templateUrl: 'medicare.html',
        controller: 'MedicareController'
    };

    $scope.showMedicare = function() {
        var d = $dialog.dialog($scope.medicareDialogOptions);
        d.open();
    }

    $scope.withholdingDialogOptions = {
        backdrop: true,
        keyboard: true,
        backdropClick: false,
        dialogClass: 'modal withholding-dialog',
        templateUrl: 'withholding.html',
        controller: 'WithholdingController'
    };

    $scope.showWithholding = function() {
        var d = $dialog.dialog($scope.withholdingDialogOptions);
        d.open();
    }

    $scope.employeeDialogOptions = {
        backdrop: true,
        keyboard: true,
        backdropClick: false,
        dialogClass: 'modal employee-dialog',
        templateUrl: 'employee.html',
        controller: 'EmployeeController'
    };

    $scope.showEmployee = function() {
        var d = $dialog.dialog($scope.employeeDialogOptions);
        d.open();
    }

    $scope.storeDialogOptions = {
        backdrop: true,
        keyboard: true,
        backdropClick: false,
        dialogClass: 'modal ss-dialog',
        templateUrl: 'store.html',
        controller: 'StoreController'
    };

    $scope.showStores = function() {
        var d = $dialog.dialog($scope.storeDialogOptions);
        d.open();
    };
});

payrollModule.factory('DataService', DataService);
payrollModule.controller('CalendarController', CalendarController);

payrollModule.factory('GeneralSetupRepository', GeneralSetupRepository);
payrollModule.factory('SocialSecurityRepository', SocialSecurityRepository);
payrollModule.factory('StoreRepository', StoreRepository);
payrollModule.factory('WithholdingTypesRepository', WithholdingTypesRepository);
payrollModule.factory('MedicareRepository', MedicareRepository);
payrollModule.factory('WithholdingRepository', WithholdingRepository);
payrollModule.factory('EmployeeRepository', EmployeeRepository);

payrollModule.controller('GeneralSetupController', GeneralSetupController);
payrollModule.controller('SocialSecurityController', SocialSecurityController);
payrollModule.controller('StoreController', StoreController);
payrollModule.controller('WithholdingTypesController', WithholdingTypesController);
payrollModule.controller('MedicareController', MedicareController);
payrollModule.controller('WithholdingController', WithholdingController);
payrollModule.controller('EmployeeController', EmployeeController);

payrollModule.controller('EmployeeListController', EmployeeListController);




