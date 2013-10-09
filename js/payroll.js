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

payrollModule.controller('PayrollController',function($scope, $dialog, DataService, EmployeeRepository) {

    DataService.init();

    var weekEnding = new Date();
    if (weekEnding.getDay() < 6) {
        weekEnding.setDate(weekEnding.getDate() + ( 6 - weekEnding.getDay()));
    }

    $scope.weekEnding = weekEnding;
    $scope.application = {};

    $scope.$watch('weekEnding', function(newValue, oldValue) {
        if (newValue) {
            if (!$scope.application[$scope.weekEnding]) {
                $scope.application[$scope.weekEnding] = {};
            }
            var weekEnding = new Date(newValue.getTime());
            var firstOfMonth = new Date(newValue.getTime());
            firstOfMonth.setDate(1);
            var dayOfFirst = firstOfMonth.getDay();
            var month = weekEnding.getMonth();
            var endOfMonth = new Date();
            var daysInMonth = 28;
            for (var i = 31; i > 28; i--) {
                endOfMonth.setTime(newValue.getTime());
                endOfMonth.setDate(i);
                if (month == endOfMonth.getMonth()) {
                    daysInMonth = i;
                    break;
                }
            }

            var daysAfterFirstPayday = daysInMonth - (7 - dayOfFirst);
            if (daysAfterFirstPayday > 27) {
                $scope.application[$scope.weekEnding].payDays = 5;
            } else {
                $scope.application[$scope.weekEnding].payDays = 4;
            }

            $scope.selectEmployee($scope.employee);
        } else {
            $scope.application[$scope.weekEnding].payDays = 0;
        }
    });

    $scope.employees;
    $scope.employee;

    $scope.selectEmployee = function(employee) {
        if (!employee[$scope.weekEnding]) {
            employee[$scope.weekEnding] = { schedule:
                { sun: { am:false, pm:false, eve:false },
        mon: { amIn:'', amOut:'', pmIn:'', pmOut:'', eveIn: '', eveOut:'' },
        tue: { amIn:'', amOut:'', pmIn:'', pmOut:'', eveIn: '', eveOut:'' },
        wed: { amIn:'', amOut:'', pmIn:'', pmOut:'', eveIn: '', eveOut:'' },
        thu: { amIn:'', amOut:'', pmIn:'', pmOut:'', eveIn: '', eveOut:'' },
        fri: { amIn:'', amOut:'', pmIn:'', pmOut:'', eveIn: '', eveOut:'' },
        sat: { amIn:'', amOut:'', pmIn:'', pmOut:'', eveIn: '', eveOut:'' }}
            };
        }
        $scope.employee = employee;
    };

    $scope.loadEmployeeList = function() {
        EmployeeRepository.getAll()
            .then(function(result){
                result.sort(function(a, b) {
                    return (a.lastName < b.lastName) ? -1 : ((a.lastName > b.lastName) ? 1 : (a.firstName < b.firstName) ? -1 : 1);
                });
                $scope.employees = result;
                if ($scope.employees.length > 0) { $scope.employee = $scope.employees[0]; }
            }, function() { alert("Error loading Employee list.")});
    };

    $scope.loadEmployeeList();


    $scope.disabledWeekdays = function(date, mode) {
        return ( mode === 'day' && ( date.getDay() < 6 ) );
    };


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




