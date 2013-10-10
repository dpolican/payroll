/**
 * Created with JetBrains WebStorm.
 * User: ewkoenw
 * Date: 9/2/13
 * Time: 6:24 PM
 * To change this template use File | Settings | File Templates.
 */
var PayrollConstants = {
    weekdays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    paySchedule: ['Weekly'],
    noWorkHoliday: 'nowork',
    legalHoliday: 'legal',
    specialHoliday: 'special',
    holidays: ['none', 'nowork', 'legal', 'special'],
    daysOfWeek: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat']
};

var PayrollUtils = {
    parseTime: function(value) {
        try {
            if (value) {
                return new Date(Date.parse('1/1/1970 ' + value));
            }
        } catch(e) {
            console.log("Error parsing time: " + value);
        }
        return null;
    },
    getElapsedMillis: function(fromTime, toTime) {
        var from = this.parseTime(fromTime);
        var to = this.parseTime(toTime);
        if (from && to) { return to.getTime() - from.getTime(); };
        return 0;
    },

    calculateHours: function(day) {
        return (this.getElapsedMillis(day.amIn, day.amOut)
            + this.getElapsedMillis(day.pmIn, day.pmOut)
        + this.getElapsedMillis(day.eveIn, day.eveOut)) / 3600000;
    },

    isScheduleMet: function(schedule, day) {
        if (day.amIn && day.pmOut) {
            var lunchBreak = this.getElapsedMillis(day.amOut, day.pmIn);
            var amIn = this.parseTime(day.amIn);
            var pmOut = this.parseTime(day.pmOut);
            return (amIn.getTime() <= schedule.in.getTime() && pmOut.getTime() >= schedule.out.getTime() && lunchBreak <= schedule.lunchBreak)
        }
        return false;
    },

    calculateDayPay: function(dayName, employee, timesheet, paystub, generalSetup, weekInfo) {
        var dayIndex = PayrollConstants.daysOfWeek.indexOf(dayName);
        var yesterdayName = 'sat';
        if (dayIndex) {
            yesterdayName = PayrollConstants.daysOfWeek[dayIndex - 1];
        }
        var day = timesheet[dayName];
        var dayBefore = timesheet[yesterdayName];
        var dayBeforeHoliday;
        if (dayName !== PayrollConstants.daysOfWeek[0]) {
            dayBeforeHoliday = PayrollConstants.holidays[weekInfo.holidays[yesterdayName]]
        }

        var holiday = PayrollConstants.holidays[weekInfo.holidays[dayName]];
        if (holiday === PayrollConstants.noWorkHoliday) {
            if (dayName === PayrollConstants.daysOfWeek[0] || dayBefore.hours > 0 || dayBeforeHoliday === PayrollConstants.noWorkHoliday) {
                paystub.regularPay += generalSetup.regularHours * employee.hourlyRate;
            }
        } else if (holiday === PayrollConstants.legalHoliday && (dayName === PayrollConstants.daysOfWeek[0] || dayBefore.hours > 0)) {
            paystub.regularPay += day.hours * employee.hourlyRate * generalSetup.legalHolidayFactor;
        } else if (holiday === PayrollConstants.specialHoliday && (dayName === PayrollConstants.daysOfWeek[0] || dayBefore.hours > 0)) {
            paystub.regularPay += day.hours * employee.hourlyRate * generalSetup.specialHolidayFactor;
        } else {

        }

    }
};

var payrollModule = angular.module('payroll', ['ui.bootstrap', 'ngGrid']);

payrollModule.controller('PayrollController',function($scope, $dialog, DataService, EmployeeRepository, GeneralSetupRepository) {

    DataService.init();

    var weekEnding = new Date();
    if (weekEnding.getDay() < 6) {
        weekEnding.setDate(weekEnding.getDate() + ( 6 - weekEnding.getDay()));
    }

    $scope.weekEnding = weekEnding;
    $scope.application = {};
    $scope.generalSetup;
    $scope.employees;
    $scope.employee;
    $scope.timesheet;
    $scope.paystub;

    GeneralSetupRepository.getData()
        .then(function(result){
            $scope.generalSetup = result;
        }, function() { alert("Error loading General Setup for main page.")});

    $scope.$watch('weekEnding', function(newValue, oldValue) {
        if (newValue) {
            if (!$scope.application[$scope.weekEnding]) {
                $scope.application[$scope.weekEnding] = { payDays: 0, holidays: {} };
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
        }
    });

    $scope.$watch('timesheet', function(newValue, oldValue) {
        if ($scope.timesheet) {
            var timesheet = $scope.timesheet;
            timesheet.mon.hours = PayrollUtils.calculateHours(timesheet.mon);
            timesheet.tue.hours = PayrollUtils.calculateHours(timesheet.tue);
            timesheet.wed.hours = PayrollUtils.calculateHours(timesheet.wed);
            timesheet.thu.hours = PayrollUtils.calculateHours(timesheet.thu);
            timesheet.fri.hours = PayrollUtils.calculateHours(timesheet.fri);
            timesheet.sat.hours = PayrollUtils.calculateHours(timesheet.sat);
            timesheet.total = timesheet.mon.hours + timesheet.tue.hours + timesheet.wed.hours
                + timesheet.thu.hours + timesheet.fri.hours + timesheet.sat.hours;

            var schedule = {};
            schedule.in = PayrollUtils.parseTime($scope.employee.amIn);
            schedule.out = PayrollUtils.parseTime($scope.employee.pmOut);
            schedule.lunchBreak = PayrollUtils.getElapsedMillis($scope.employee.amOut, $scope.employee.pmIn);

            timesheet.incentiveMet = PayrollUtils.isScheduleMet(schedule, timesheet.mon) &&
                PayrollUtils.isScheduleMet(schedule, timesheet.tue) &&
                PayrollUtils.isScheduleMet(schedule, timesheet.wed) &&
                PayrollUtils.isScheduleMet(schedule, timesheet.thu) &&
                PayrollUtils.isScheduleMet(schedule, timesheet.fri) &&
                PayrollUtils.isScheduleMet(schedule, timesheet.sat);

        }
    }, true);

    $scope.calculatePay = function() {
        var timesheet = $scope.timesheet;
        var paystub = $scope.paystub;
        var employee = $scope.employee;
        var generalSetup = $scope.generalSetup;
        var weekInfo = $scope.application[$scope.weekEnding];

        if (timesheet && paystub && employee) {
            paystub.regularPay = 0;
            paystub.incentivePay = 0;

            if (timesheet.incentiveMet && employee.hasIncentive) {
                paystub.incentivePay = employee.incentivePay;
            }

            PayrollUtils.calculateDayPay('mon', employee, timesheet, paystub, generalSetup, weekInfo);
            PayrollUtils.calculateDayPay('tue', employee, timesheet, paystub, generalSetup, weekInfo);
            PayrollUtils.calculateDayPay('wed', employee, timesheet, paystub, generalSetup, weekInfo);
            PayrollUtils.calculateDayPay('thu', employee, timesheet, paystub, generalSetup, weekInfo);
            PayrollUtils.calculateDayPay('fri', employee, timesheet, paystub, generalSetup, weekInfo);
            PayrollUtils.calculateDayPay('sat', employee, timesheet, paystub, generalSetup, weekInfo);
        }


    };

    $scope.selectEmployee = function(employee) {
        if (employee) {
            if (!employee[$scope.weekEnding]) {
                employee[$scope.weekEnding] = { timesheet:
                { sun: { am:false, pm:false, eve:false },
                    mon: { amIn:'', amOut:'', pmIn:'', pmOut:'', eveIn: '', eveOut:'' },
                    tue: { amIn:'', amOut:'', pmIn:'', pmOut:'', eveIn: '', eveOut:'' },
                    wed: { amIn:'', amOut:'', pmIn:'', pmOut:'', eveIn: '', eveOut:'' },
                    thu: { amIn:'', amOut:'', pmIn:'', pmOut:'', eveIn: '', eveOut:'' },
                    fri: { amIn:'', amOut:'', pmIn:'', pmOut:'', eveIn: '', eveOut:'' },
                    sat: { amIn:'', amOut:'', pmIn:'', pmOut:'', eveIn: '', eveOut:'' }},
                    paystub: {}
                };
            }
            $scope.employee = employee;
            $scope.timesheet = employee[$scope.weekEnding].timesheet;
            $scope.paystub = employee[$scope.weekEnding].paystub;
        }
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

    $scope.toggleHoliday = function(day) {
        var value = $scope.application[$scope.weekEnding].holidays[day];
        if (!value) {
            value = 1;
        } else if (value >= (PayrollConstants.holidays.length - 1)) {
            value = 0;
        } else {
            value++;
        }

        $scope.application[$scope.weekEnding].holidays[day] = value;
    }


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

payrollModule.directive('inoutValidate', function() {
    return {
        // restrict to an attribute type.
        restrict: 'A',

        // element must have ng-model attribute.
        require: 'ngModel',

        // scope = the parent scope
        // elem = the element the directive is on
        // attr = a dictionary of attributes on the element
        // ctrl = the controller for ngModel.
        link: function(scope, elem, attr, ctrl) {
            var modelParts = attr.ngModel.split('.');
            var timeEntry = modelParts[modelParts.length - 1];
            var isOutTime = (timeEntry.indexOf('Out') > -1);
            var timeSlot = isOutTime ? timeEntry.substr(0, (timeEntry.length - 3)) : timeEntry.substr(0, (timeEntry.length - 2));
            var compareField = isOutTime ? (timeSlot + 'In') : (timeSlot == 'eve' ? 'pmOut' : 'amOut');
            var weekday = modelParts[modelParts.length - 2];

            ctrl.$parsers.unshift(function(timeString) {
                var previousTimeString = scope.timesheet[weekday][compareField];

                var valid = true;
                var time = PayrollUtils.parseTime(timeString);
                if (time) {
                    var previousTime = PayrollUtils.parseTime(previousTimeString);
                    valid = previousTime && (time.getTime() >= previousTime.getTime());
                } else if (isOutTime) {
                    valid = !previousTimeString;
                }
                ctrl.$setValidity('inoutValidate', valid);

                return valid ? timeString : undefined;
            });
        }
    };
});




