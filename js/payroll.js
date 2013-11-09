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
    daysOfWeek: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'],
    monday: 'mon',
    employeeUpdatedEvent: 'employeeUpdate',
    withholdingUpdatedEvent: 'withholdingUpdate',
    withholdingTypeUpdatedEvent: 'withholdingTypeUpdate',
    socialSecurityUpdatedEvent: 'socialSecurityUpdate',
    medicareUpdatedEvent: 'medicareUpdate',
    generalSetupUpdatedEvent: 'generalSetupUpdate',
    storeUpdateEvent: 'storeUpdate',
    importEvent: 'importEvent'
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

    getTimelessDate: function(date) {
        if (angular.isString(date)) {
            var millis = Date.parse(date);
            date = new Date();
            date.setTime(millis);
        }
        if (angular.isDate(date)) {
            var timelessDate = new Date(date.getTime());
            timelessDate.setHours(0);
            timelessDate.setMinutes(0);
            timelessDate.setSeconds(0);
            timelessDate.setMilliseconds(0);
            return timelessDate;
        }

        return date;
    },

    getKeyFromDate: function(date) {
        return "" + date.getFullYear() + "/" + date.getMonth() + "/" + date.getDate();
    },

    getDateFromKey: function(key) {
        if (key) {
            var parts = key.split('/');
            if (parts && parts.length === 3) {
                var result = new Date();
                result.setYear(parseInt(parts[0]));
                result.setMonth(parseInt(parts[1]));
                result.setDate(parseInt(parts[2]));
                return this.getTimelessDate(result);
            }
        }
        return null;
    },

    getElapsedMillis: function(fromTime, toTime) {
        var from = this.parseTime(fromTime);
        var to = this.parseTime(toTime);
        if (from && to) { return to.getTime() - from.getTime(); }
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
            return (amIn.getTime() <= schedule['in'].getTime() && pmOut.getTime() >= schedule.out.getTime() && lunchBreak <= schedule.lunchBreak)
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
            if (dayName === PayrollConstants.monday || dayBefore.hours > 0 || dayBeforeHoliday === PayrollConstants.noWorkHoliday) {
                paystub.regularPay += generalSetup.regularHours * employee.hourlyRate;
            }
        } else if (holiday === PayrollConstants.legalHoliday && (dayName === PayrollConstants.monday || dayBefore.hours > 0)) {
            paystub.regularPay += day.hours * employee.hourlyRate * generalSetup.legalHolidayFactor;
        } else if (holiday === PayrollConstants.specialHoliday && (dayName === PayrollConstants.monday || dayBefore.hours > 0)) {
            paystub.regularPay += day.hours * employee.hourlyRate * generalSetup.specialHolidayFactor;
        } else {
            if (day.hours > 0) {
                paystub.daysOfWork += 1;
                if (day.hours >= generalSetup.regularHours) {
                    paystub.regularPay += generalSetup.regularHours * employee.hourlyRate;
                    // Overtime rate calculation happens later.
                    paystub.overtimePay += (day.hours - generalSetup.regularHours) * employee.hourlyRate;
                } else {
                    paystub.regularPay += day.hours * employee.hourlyRate;
                }
            }
        }
    },

    calculateOvertimePay: function(employee, paystub, generalSetup) {
        if (employee.overtimePay) {
            paystub.overtimePay *= generalSetup.overtimeFactor;
        }
    },

    calculateIncentivePay: function(employee, timesheet, paystub) {
        if (timesheet.incentiveMet && employee.hasIncentive) {
            paystub.incentivePay = employee.incentivePay;
        } else {
            paystub.incentivePay = 0;
        }
    },

    calculateSundayPay: function(employee, timesheet, paystub) {
        paystub.sundayPay = 0;
        paystub.sundayIncentive = 0;
        if (timesheet.sun.am) {
            paystub.sundayPay += employee.sundayAMPay;
        }
        if (timesheet.sun.pm) {
            paystub.sundayPay += employee.sundayPMPay;
        }
        if (timesheet.sun.eve && employee.hasSundayIncentive) {
            paystub.sundayIncentive += employee.sundayIncentivePay
        }
    },

    calculateBenefitPay: function(employee, timesheet, paystub, generalSetup) {
        paystub.benefitPay = ((timesheet.sickDays ? timesheet.sickDays : 0)
            + (timesheet.vacationDays ? timesheet.vacationDays : 0)) * generalSetup.regularHours * employee.hourlyRate;
    },

    calculateWithholding: function($filter, withholdingCriteria, employee, paystub) {
        paystub.withholding = 0;
        if (employee && employee.processWithholding) {
            var filteredWithholdingCriteria = $filter('filter')(withholdingCriteria,
                function (item) {
                    return (item.status === employee.withholdingType && parseFloat(item.salaryLimit) < paystub.subtotalPay);
                });
            filteredWithholdingCriteria = $filter('orderBy')(filteredWithholdingCriteria, function (item) {
                return parseFloat(item.salaryLimit)
            }, true);
            var withholdingCriterium = filteredWithholdingCriteria.length > 0 ? filteredWithholdingCriteria[0] : null;
            if (withholdingCriterium) {
                paystub.withholding = (paystub.subtotalPay - parseFloat(withholdingCriterium.salaryLimit)) * parseFloat(withholdingCriterium.factor) + parseFloat(withholdingCriterium.base);
            }
        }
    },

    calculateSocialSecurity: function($filter, socialSecurityCriteria, employee, paystub, $scope) {
        paystub.employeeSS = 0;
        if (employee && employee.processSocialSecurity) {
            var filteredSocialSecurityCriteria = $filter('filter')(socialSecurityCriteria,
                function (item) {
                    return (parseFloat(item.salary) < (paystub.subtotalPay * $scope.generalSetup.application[$scope.weekEndingKey].payDays));
                });
            filteredSocialSecurityCriteria = $filter('orderBy')(filteredSocialSecurityCriteria, function (item) {
                return parseFloat(item.salary)
            }, true);
            var socialSecurityCriterium = filteredSocialSecurityCriteria.length > 0 ? filteredSocialSecurityCriteria[0] : null;
            if (socialSecurityCriterium) {
                paystub.employeeSS = socialSecurityCriterium.employeeSS / $scope.generalSetup.application[$scope.weekEndingKey].payDays;
            }
        }
    },

    calculateMedicare: function($filter, medicareCriteria, employee, paystub, $scope) {
        paystub.employeeMedicare = 0;
        if (employee && employee.processMedicare) {
            var filteredMedicareCriteria = $filter('filter')(medicareCriteria,
                function (item) {
                    return (parseFloat(item.from) < (paystub.subtotalPay * $scope.generalSetup.application[$scope.weekEndingKey].payDays));
                });
            filteredMedicareCriteria = $filter('orderBy')(filteredMedicareCriteria, function (item) {
                return parseFloat(item.from)
            }, true);
            var medicareCriterium = filteredMedicareCriteria.length > 0 ? filteredMedicareCriteria[0] : null;
            if (medicareCriterium) {
                paystub.employeeMedicare = medicareCriterium.employee / $scope.generalSetup.application[$scope.weekEndingKey].payDays;
            }
        }
    }
};

var payrollModule = angular.module('payroll', ['ui.bootstrap', 'ngGrid']);

payrollModule.controller('PayrollController',function($scope, $filter, $dialog, $location, DataService, EmployeeRepository,
                                                      GeneralSetupRepository, WithholdingRepository, SocialSecurityRepository, MedicareRepository,
                                                      WithholdingTypesRepository, StoreRepository) {

    DataService.init();

    var weekEnding = new Date();
    if (weekEnding.getDay() < 6) {
        weekEnding.setDate(weekEnding.getDate() + ( 6 - weekEnding.getDay()));
    }

    $scope.weekEnding = weekEnding;
    $scope.weekEndingKey = PayrollUtils.getKeyFromDate($scope.weekEnding);

    $scope.generalSetup;
    $scope.employees;
    $scope.withholdingCriteria;
    $scope.socialSecurityCriteria;
    $scope.medicareCriteria;
    $scope.withholdingTypes;
    $scope.stores;

    $scope.employee;
    $scope.timesheet;
    $scope.paystub;
    $scope.paystubSaved;

    $scope.activeOnlyFilter = { active: true };

// Begin observers

    $scope.$on(PayrollConstants.importEvent, function(event, args) {
        $scope.importData(args);
    });

    $scope.$on(PayrollConstants.employeeUpdatedEvent, function(event, args) {
        $scope.loadEmployeeList();
    });

    $scope.$on(PayrollConstants.withholdingUpdatedEvent, function(event, args) {
        $scope.loadWithholdingData();
    });

    $scope.$on(PayrollConstants.withholdingTypeUpdatedEvent, function(event, args) {
        $scope.loadWithholdingTypes();
    });

    $scope.$on(PayrollConstants.socialSecurityUpdatedEvent, function(event, args) {
        $scope.loadSocialSecurityData();
    });

    $scope.$on(PayrollConstants.medicareUpdatedEvent, function(event, args) {
        $scope.loadMedicareData();
    });

    $scope.$on(PayrollConstants.storeUpdateEvent, function(event, args) {
        $scope.loadStores();
    });
    $scope.$on(PayrollConstants.generalSetupUpdatedEvent, function(event, args) {
        $scope.loadGeneralSetupData();
    });

    $scope.$watch('weekEnding', function(newValue, oldValue) {
        if (newValue) {
            $scope.weekEndingKey = PayrollUtils.getKeyFromDate(newValue);
            $scope.updatePayweekInfo();
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
            schedule['in'] = PayrollUtils.parseTime($scope.employee.amIn);
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

// End observers

// Begin methods for weekly summary page
    $scope.calculateWeeklyTotal = function(employeeOrStoreId, weekEnding, properties) {
        var employees = [];
        if (typeof(employeeOrStoreId) === "number") {
            var storeId = employeeOrStoreId;

            angular.forEach($scope.employees, function(employee) {
                if (employee.storeId === storeId) {
                    this.push(employee);
                }
            }, employees);
        } else {
            employees.push(employeeOrStoreId);
        }

        var payday = new Date();
        payday.setTime(weekEnding.getTime());

        var fields = angular.isString(properties) ? [properties] : properties;

        var runningTotal = 0;

        var key = PayrollUtils.getKeyFromDate(payday);

        angular.forEach(employees, function(employee) {
            if (employee && employee[key] && employee[key].paystub) {
                angular.forEach(fields, function(field) {
                    if (employee[key].paystub[field]) {
                        runningTotal += employee[key].paystub[field];
                    }
                });
            }
        });

        payday.setDate(payday.getDate() + 7);

        return runningTotal;
    };
// End methods for weekly summary page

// Begin methods for monthly summary page
    $scope.calculateMonthlyTotal = function(employeeOrStoreId, weekEnding, properties) {
        var employees = [];
        if (typeof(employeeOrStoreId) === "number") {
            var storeId = employeeOrStoreId;

            angular.forEach($scope.employees, function(employee) {
                if (employee.storeId === storeId) {
                    this.push(employee);
                }
            }, employees);
        } else {
            employees.push(employeeOrStoreId);
        }

        var payday = new Date();
        payday.setTime(weekEnding.getTime());
        var paymonth = payday.getMonth();
        payday.setDate(payday.getDate() % 7);

        var fields = angular.isString(properties) ? [properties] : properties;

        var runningTotal = 0;
        do {
            var key = PayrollUtils.getKeyFromDate(payday);

            angular.forEach(employees, function(employee) {
                if (employee && employee[key]) {
                    angular.forEach(fields, function(field) {
                        var partOne = 'paystub';
                        var partTwo = field;

                        if (field.indexOf('.') > -1) {
                            var parts = field.split('.');
                            if (parts.length > 1) {
                                partOne = parts[0];
                                partTwo = parts[1];
                            }
                        }

                        if (employee[key][partOne] && employee[key][partOne][partTwo]) {
                            runningTotal += employee[key][partOne][partTwo];
                        }
                    });
                }
            });

            payday.setDate(payday.getDate() + 7);
        } while (payday.getMonth() === paymonth);
        return runningTotal;
    };

// End methods for monthly summary page.

// Begin methods for yearly summary page.

    $scope.calculateYearlyTotal = function(employeeOrStoreId, weekEnding, properties) {
        var employees = [];
        if (typeof(employeeOrStoreId) === "number") {
            var storeId = employeeOrStoreId;

            angular.forEach($scope.employees, function(employee) {
                if (employee.storeId === storeId) {
                    this.push(employee);
                }
            }, employees);
        } else {
            employees.push(employeeOrStoreId);
        }

        var payyear = weekEnding.getFullYear();
        var dayOfWeek = weekEnding.getDay();

        var payday = new Date();
        payday.setTime(weekEnding.getTime());
        payday.setMonth(0);
        payday.setDate(1);
        if (dayOfWeek != payday.getDay()) {
            var diff = dayOfWeek - payday.getDay();
            if (diff < 0) {
                diff += 7;
            }

            payday.setDate(1 + diff);
        }

        var fields = angular.isString(properties) ? [properties] : properties;

        var runningTotal = 0;
        do {
            var key = PayrollUtils.getKeyFromDate(payday);

            angular.forEach(employees, function(employee) {
                if (employee && employee[key]) {
                    angular.forEach(fields, function(field) {
                        var partOne = 'paystub';
                        var partTwo = field;

                        if (field.indexOf('.') > -1) {
                            var parts = field.split('.');
                            if (parts.length > 1) {
                                partOne = parts[0];
                                partTwo = parts[1];
                            }
                        }

                        if (employee[key][partOne] && employee[key][partOne][partTwo]) {
                            runningTotal += employee[key][partOne][partTwo];
                        }
                    });
                }
            });

            payday.setDate(payday.getDate() + 7);
        } while (payday.getFullYear() === payyear);
        return runningTotal;
    };

// End methods for yearly summary page.

// Begin startup methods.
    $scope.loadGeneralSetupData = function() {
        GeneralSetupRepository.getData()
            .then(function(result) {
                if (!result.application) {
                    result.application = {};
                }
                var currentPayPeriod = $scope.generalSetup ? $scope.generalSetup.application[$scope.weekEndingKey] : null;
                if (!result.application[$scope.weekEndingKey] && currentPayPeriod) {
                    result.application[$scope.weekEndingKey] = currentPayPeriod;
                }
                $scope.generalSetup = result;

                if (!currentPayPeriod) {
                    $scope.updatePayweekInfo();
                }
            }, function() { alert("Error loading General Setup data.")});
    };

    $scope.loadSocialSecurityData = function() {
        SocialSecurityRepository.getAll()
            .then(function(result) {
                $scope.socialSecurityCriteria = result;
            }, function() { alert("Error loading Social Security data.")})
    };

    $scope.loadWithholdingData = function() {
        WithholdingRepository.getAll()
            .then(function(result) {
                $scope.withholdingCriteria = result;
            }, function() { alert("Error loading Withholding data.")})
    };

    $scope.loadMedicareData = function() {
        MedicareRepository.getAll()
            .then(function(result) {
                $scope.medicareCriteria = result;
            }, function() { alert("Error loading Medicare data.")})
    };

    $scope.loadEmployeeList = function(successHandler) {
        EmployeeRepository.getAll()
            .then(function(result){
                result.sort(function(a, b) {
                    return (a.lastName < b.lastName) ? -1 : ((a.lastName > b.lastName) ? 1 : (a.firstName < b.firstName) ? -1 : 1);
                });
                $scope.employees = result;
                if ($scope.employees.length > 0) { $scope.employee = $scope.employees[0]; }
                if(!$scope.$$phase) { $scope.$digest(); }
                if (successHandler) { successHandler(); }
            }, function() { alert("Error loading Employee list.")});
    };

    $scope.loadWithholdingTypes = function() {
        WithholdingTypesRepository.getAll()
            .then(function(result){
                $scope.withholdingTypes = result;
            }, function() { alert("Error loading Withholding Types.")});
    };

    $scope.loadStores = function(successHandler) {
        StoreRepository.getStores()
            .then(function(result){
                $scope.stores = result;
                if (successHandler) { successHandler(); }
            }, function() { alert("Error loading Stores.")});
    };

    $scope.initializeParams = function() {
        var weekEndingKey = $location.search().weekEndingKey;
        if (weekEndingKey) {
            $scope.weekEndingKey = weekEndingKey;
            $scope.weekEnding = PayrollUtils.getDateFromKey(weekEndingKey);
            var employeeId = $location.search().employeeId;
            if (employeeId) {
                angular.forEach($scope.employees, function(employee, index) {
                    if (employee.id == employeeId) {
                        $scope.selectEmployee(employee);
                    }
                })
            }
        }
    };

    setTimeout(function() {
        $scope.loadGeneralSetupData();
        $scope.loadWithholdingData();
        $scope.loadSocialSecurityData();
        $scope.loadMedicareData();
        $scope.loadEmployeeList($scope.initializeParams);
        $scope.loadWithholdingTypes();
        $scope.loadStores();
    }, 500);

// End startup methods

// Begin main page functions
    $scope.validateSickDays = function() {
        if ($scope.timesheet.sickDays && $scope.timesheet.sickDays > 0) {
            var usedSickDays = $scope.calculateYearlyTotal($scope.employee, $scope.weekEnding, "timesheet.sickDays");
            if (usedSickDays > $scope.employee.sickDays) {
                var remainingSickDays = $scope.employee.sickDays - (usedSickDays - $scope.timesheet.sickDays);
                $scope.timesheet.sickDays = (remainingSickDays > 0) ? remainingSickDays : 0;
            }
        }
    };
    $scope.validateVacationDays = function() {
        if ($scope.timesheet.vacationDays && $scope.timesheet.vacationDays > 0) {
            var usedVacationDays = $scope.calculateYearlyTotal($scope.employee, $scope.weekEnding, "timesheet.vacationDays");
            if (usedVacationDays > $scope.employee.vacationDays) {
                var remainingVacationDays = $scope.employee.vacationDays - (usedVacationDays - $scope.timesheet.vacationDays);
                $scope.timesheet.vacationDays  = (remainingVacationDays > 0) ? remainingVacationDays : 0;
            }
        }
    };

    $scope.updatePayweekInfo = function() {
        if ($scope.generalSetup) {
            if (!$scope.generalSetup.application) {
                $scope.generalSetup.application = {};
            }
            if (!$scope.generalSetup.application[$scope.weekEndingKey]) {
                $scope.generalSetup.application[$scope.weekEndingKey] = { payDays: 0, holidays: {} };
            }
            var weekEnding = new Date($scope.weekEnding.getTime());
            var firstOfMonth = new Date($scope.weekEnding.getTime());
            firstOfMonth.setDate(1);
            var dayOfFirst = firstOfMonth.getDay();
            var month = weekEnding.getMonth();
            var endOfMonth = new Date();
            var daysInMonth = 28;
            for (var i = 31; i > 28; i--) {
                endOfMonth.setTime($scope.weekEnding.getTime());
                endOfMonth.setDate(i);
                if (month == endOfMonth.getMonth()) {
                    daysInMonth = i;
                    break;
                }
            }

            var daysAfterFirstPayday = daysInMonth - (7 - dayOfFirst);
            if (daysAfterFirstPayday > 27) {
                $scope.generalSetup.application[$scope.weekEndingKey].payDays = 5;
            } else {
                $scope.generalSetup.application[$scope.weekEndingKey].payDays = 4;
            }

            $scope.selectEmployee($scope.employee);
        }
    };

    $scope.exportData= function() {
        var data = {};
        data.generalSetup = $scope.generalSetup;
        data.withholdingTypes = $scope.withholdingTypes;
        data.employees = $scope.employees;
        data.withholdingCriteria = $scope.withholdingCriteria;
        data.socialSecurityCriteria = $scope.socialSecurityCriteria;
        data.medicareCriteria = $scope.medicareCriteria;
        data.stores = $scope.stores;

        var pom = document.createElement('a');
        pom.setAttribute('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data)));
        pom.setAttribute('download', 'payroll.json');
        pom.click();
    };

    $scope.importData = function(data) {
        if (data.generalSetup) {
            $scope.generalSetup = data.generalSetup;
            GeneralSetupRepository.saveData(data.generalSetup);
        }
        if (data.stores) {
            $scope.stores = data.stores;
            StoreRepository.saveStores(data.stores);
        }
        if (data.withholdingTypes) {
            $scope.withholdingTypes = data.withholdingTypes;
            WithholdingTypesRepository.saveAll(data.withholdingTypes);
        }
        if (data.employees) {
            $scope.employees = data.employees;
            EmployeeRepository.saveAll(data.employees);
        }
        if (data.withholdingCriteria){
            $scope.withholdingCriteria = data.withholdingCriteria;
            WithholdingRepository.saveAll(data.withholdingCriteria);
        }
        if (data.socialSecurityCriteria) {
            $scope.socialSecurityCriteria = data.socialSecurityCriteria;
            SocialSecurityRepository.saveAll(data.socialSecurityCriteria);
        }
        if (data.medicareCriteria) {
            $scope.medicareCriteria = data.medicareCriteria;
            MedicareRepository.saveAll(data.medicareCriteria);
        }
    };

    $scope.calculatePay = function() {
        var timesheet = $scope.timesheet;
        var paystub = $scope.paystub;
        var employee = $scope.employee;
        var generalSetup = $scope.generalSetup;
        var weekInfo = $scope.generalSetup.application[PayrollUtils.getKeyFromDate($scope.weekEnding)];

        if (timesheet && paystub && employee) {
            $scope.paystubSaved = false;
            paystub.daysOfWork = 0;
            paystub.regularPay = 0;
            paystub.overtimePay = 0;
            paystub.commission = timesheet.commission ? parseFloat(timesheet.commission) : 0;
            paystub.cashAdvance = timesheet.cashAdvance ? parseFloat(timesheet.cashAdvance) : 0;
            PayrollUtils.calculateIncentivePay(employee, timesheet, paystub);
            PayrollUtils.calculateDayPay('mon', employee, timesheet, paystub, generalSetup, weekInfo);
            PayrollUtils.calculateDayPay('tue', employee, timesheet, paystub, generalSetup, weekInfo);
            PayrollUtils.calculateDayPay('wed', employee, timesheet, paystub, generalSetup, weekInfo);
            PayrollUtils.calculateDayPay('thu', employee, timesheet, paystub, generalSetup, weekInfo);
            PayrollUtils.calculateDayPay('fri', employee, timesheet, paystub, generalSetup, weekInfo);
            PayrollUtils.calculateDayPay('sat', employee, timesheet, paystub, generalSetup, weekInfo);
            PayrollUtils.calculateOvertimePay(employee, paystub, generalSetup);
            PayrollUtils.calculateSundayPay(employee, timesheet, paystub, generalSetup);
            PayrollUtils.calculateBenefitPay(employee, timesheet, paystub, generalSetup);

            paystub.subtotalPay = paystub.regularPay + paystub.overtimePay + paystub.benefitPay + paystub.incentivePay
                + paystub.commission;
            paystub.totalPay = paystub.subtotalPay + paystub.sundayPay + paystub.sundayIncentive;

            PayrollUtils.calculateWithholding($filter, $scope.withholdingCriteria, employee, paystub);
            PayrollUtils.calculateSocialSecurity($filter, $scope.socialSecurityCriteria, employee, paystub, $scope);
            PayrollUtils.calculateMedicare($filter, $scope.medicareCriteria, employee, paystub, $scope);

            // Calculate Loan
            paystub.loan = 0;
            angular.forEach(employee.loans, function(loan) {
                if (loan.startDate && loan.payment && loan.endDate) {
                    if (PayrollUtils.getTimelessDate(loan.startDate).getTime() <= PayrollUtils.getTimelessDate($scope.weekEnding)
                        && PayrollUtils.getTimelessDate(loan.endDate).getTime() >= PayrollUtils.getTimelessDate($scope.weekEnding)) {
                        paystub.loan += loan.payment;
                    }
                }
            });

            paystub.totalDeduction = paystub.withholding + paystub.employeeSS + paystub.employeeMedicare + paystub.cashAdvance + paystub.loan;
            paystub.netPay = paystub.totalPay - paystub.totalDeduction;

            EmployeeRepository.saveAll($scope.employees, function() { $scope.paystubSaved = true; });
        }
    };

    $scope.selectWithholdingType = function(code) {
        var result = null;

        if (code && $scope.withholdingTypes) {
            angular.forEach($scope.withholdingTypes, function(withholdingType, index) {
                if (code === withholdingType.type) {
                    result = withholdingType;
                }
            });
        }
        return result;
    };

    $scope.selectEmployee = function(employee) {
        if (employee) {
            if (!employee[$scope.weekEndingKey]) {
                employee[$scope.weekEndingKey] = {
                    timesheet: {
                        sun: { am:false, pm:false, eve:false },
                        mon: { amIn:'', amOut:'', pmIn:'', pmOut:'', eveIn: '', eveOut:'' },
                        tue: { amIn:'', amOut:'', pmIn:'', pmOut:'', eveIn: '', eveOut:'' },
                        wed: { amIn:'', amOut:'', pmIn:'', pmOut:'', eveIn: '', eveOut:'' },
                        thu: { amIn:'', amOut:'', pmIn:'', pmOut:'', eveIn: '', eveOut:'' },
                        fri: { amIn:'', amOut:'', pmIn:'', pmOut:'', eveIn: '', eveOut:'' },
                        sat: { amIn:'', amOut:'', pmIn:'', pmOut:'', eveIn: '', eveOut:'' },
                        sickDays: 0, vacationDays: 0, commission: 0, cashAdvance: 0},
                    paystub: {}
                };
            }
            $scope.employee = employee;
            $scope.timesheet = employee[$scope.weekEndingKey].timesheet;
            $scope.paystub = employee[$scope.weekEndingKey].paystub;
        }
    };

    $scope.toggleHoliday = function(day) {
        var value = $scope.generalSetup.application[PayrollUtils.getKeyFromDate($scope.weekEnding)].holidays[day];
        if (!value) {
            value = 1;
        } else if (value >= (PayrollConstants.holidays.length - 1)) {
            value = 0;
        } else {
            value++;
        }

        $scope.generalSetup.application[PayrollUtils.getKeyFromDate($scope.weekEnding)].holidays[day] = value;
    };


    $scope.disabledWeekdays = function(date, mode) {
        return ( mode === 'day' && ( date.getDay() < 6 ) );
    };

    $scope.showImportDialog = function() {
        var d = $dialog.dialog({
            backdrop: true,
            keyboard: false,
            backdropClick: false,
            templateUrl: 'import.html',
            controller: 'ImportController'
        });
        d.open();
    }

    $scope.showGeneralSetup = function() {
        GeneralSetupRepository.saveData($scope.generalSetup);
        var d = $dialog.dialog({
            backdrop: true,
            keyboard: false,
            backdropClick: false,
            templateUrl: 'general-setup.html',
            controller: 'GeneralSetupController'
        });
        d.open();
    };

    $scope.showSocialSecurity = function() {
        var d = $dialog.dialog({
            backdrop: true,
            keyboard: false,
            backdropClick: false,
            dialogClass: 'modal ss-dialog',
            templateUrl: 'social-security.html',
            controller: 'SocialSecurityController'
        });
        d.open();
    };

    $scope.showWithholdingTypes = function() {
        var d = $dialog.dialog({
            backdrop: true,
            keyboard: false,
            backdropClick: false,
            dialogClass: 'modal wht-dialog',
            templateUrl: 'withholding-types.html',
            controller: 'WithholdingTypesController'
        });
        d.open();
    };

    $scope.showMedicare = function() {
        var d = $dialog.dialog({
            backdrop: true,
            keyboard: false,
            backdropClick: false,
            dialogClass: 'modal medicare-dialog',
            templateUrl: 'medicare.html',
            controller: 'MedicareController'
        });
        d.open();
    };

    $scope.showWithholding = function() {
        var d = $dialog.dialog({
            backdrop: true,
                keyboard: false,
                backdropClick: false,
                dialogClass: 'modal withholding-dialog',
                templateUrl: 'withholding.html',
                controller: 'WithholdingController'
        });
        d.open();
    };

    $scope.showEmployee = function() {
        EmployeeRepository.saveAll($scope.employees);
        var d = $dialog.dialog({
            backdrop: true,
            keyboard: false,
            backdropClick: false,
            dialogClass: 'modal employee-dialog',
            templateUrl: 'employee.html',
            controller: 'EmployeeController'
        });
        d.open();
    };

    $scope.showStores = function() {
        var d = $dialog.dialog({
            backdrop: true,
            keyboard: false,
            backdropClick: false,
            dialogClass: 'modal ss-dialog',
            templateUrl: 'store.html',
            controller: 'StoreController'
        });
        d.open();
    };

// End main page functions
});

payrollModule.config(['$locationProvider',
    function($locationProvider) {
        $locationProvider.html5Mode(true);
    }]);

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
payrollModule.controller('ImportController', ImportController);

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




