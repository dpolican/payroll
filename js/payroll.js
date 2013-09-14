/**
 * Created with JetBrains WebStorm.
 * User: ewkoenw
 * Date: 9/2/13
 * Time: 6:24 PM
 * To change this template use File | Settings | File Templates.
 */
var payrollModule = angular.module('payroll', ['ui.bootstrap', 'ngGrid']);

payrollModule.controller('PayrollController',function($scope, $dialog) {
    $scope.application = {
        payDays: 4,
        holidays: { sun: false, mon: false, tue: false, wed: false, thu: false, fri: false, sat: false }
    };

    var generalSetupTemplate = '<div>'
        + '<div class="modal-header"><h3>Setup</h3></div>'
        + '<div class="modal-body">Setup Data Here</div>'
        + '<div class="modal-footer">'
        + '<button class="btn btn-primary" ng-click="saveSetup()">Done</button>'
        + '<button class="btn" ng-click="cancelSetup()">Cancel</button>'
        + '</div>'
        + '</div>';

    $scope.generalSetupDialogOptions = {
        backdrop: true,
        keyboard: true,
        backdropClick: false,
        template: generalSetupTemplate,
        controller: 'GeneralSetupController'
    };

    $scope.showGeneralSetup = function() {
        var d = $dialog.dialog($scope.generalSetupDialogOptions);
        d.open();
    };

    var socialSecurityDialogTemplate = '<div>'
        + '<div class="modal-header"><h3>Social Security</h3></div>'
        + '<div class="modal-body"><div class="gridStyle" ng-grid="gridOptions"></div></div>'
        + '<div class="modal-footer">'
        + '  <button class="btn" ng-click="addRow()"><i class="icon-plus"></i> Add Row</button>'
        + '  <button class="btn" ng-click="deleteRow()"><i class="icon-minus"></i> Delete Row</button>'
        + '  <span class="span1"></span>'
        + '  <button class="offset1 btn btn-success" ng-click="saveSSS()">Save</button>'
        + '  <button class="btn btn-warning" ng-click="cancelSSS()">Cancel</button>'
        + '</div></div>';

    $scope.socialSecurityDialogOptions = {
        backdrop: true,
        keyboard: true,
        backdropClick: false,
        dialogClass: 'modal ss-dialog',
        template: socialSecurityDialogTemplate,
        controller: 'SocialSecurityController',
        resolve: {
           records: function(SocialSecurityRepository) {
               return SocialSecurityRepository.getAll();
           }
        }
    };

    $scope.showSocialSecurity = function() {
        var d = $dialog.dialog($scope.socialSecurityDialogOptions);
        d.open();
    }


});

payrollModule.factory('DataService', DataService);

payrollModule.factory('SocialSecurityRepository', SocialSecurityRepository);

payrollModule.controller('CalendarController', CalendarController);
payrollModule.controller('SocialSecurityController', SocialSecurityController);
payrollModule.controller('EmployeeListController', EmployeeListController);
payrollModule.controller('GeneralSetupController', GeneralSetupController);


