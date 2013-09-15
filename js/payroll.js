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
        + '<div class="modal-body"><form class="form-horizontal"> '
        + ' <div class="control-group"><label class="control-label">Week Ending</label><div class="controls"><input type="text" name="weekending"/></div></div>'
        + ' <fieldset><legend>Work Schedule</legend>'
        + ' <div class="span3">'
        + '  <div class="control-group">'
        + '     <label class="control-label" for="inputAMIn">AM In</label>'
        + '     <div class="controls">'
        + '         <input type="text" class="input-mini" id="inputAMIn"/>'
        + '     </div>'
        + '  </div>'
        + '  <div class="control-group">'
        + '   <label class="control-label" for="inputAMOut">AM Out</label>'
        + '   <div class="controls">'
        + '    <input type="text" class="input-mini" id="inputAMOut"/>'
        + '   </div>'
        + '  </div>'
        + ' </div>'
        + ' <div class="span3">'
        + '  <div class="control-group">'
        + '     <label class="control-label" for="inputPMIn">PM In</label>'
        + '     <div class="controls">'
        + '         <input type="text" class="input-mini" id="inputPMIn"/>'
        + '     </div>'
        + '  </div>'
        + '  <div class="control-group">'
        + '   <label class="control-label" for="inputPMOut">Pm Out</label>'
        + '   <div class="controls">'
        + '    <input type="text" class="input-mini" id="inputPMOut"/>'
        + '   </div>'
        + '  </div>'
        + ' </div>'


        + '  <div class="control-group"><label class="control-label">Regular Hours</label><div class="controls"><input type="text" name="weekending" class="input-mini"/></div></div>'
        + ' </fieldset>'
        + ' <fieldset><legend>Employee Benefits</legend>'
        + '  <div class="control-group"><label class="control-label" >Pay Schedule</label><div class="controls"><input type="text" name="weekending"/></div></div>'
        + '  <div class="control-group"><label class="control-label">Incentive Pay</label><div class="controls"><input type="text" name="weekending" class="input-small"/></div></div>'
        + '  <div class="control-group"><label class="control-label" >Sunday Incentive</label><div class="controls"><input type="text" name="weekending" class="input-small"/></div></div>'
        + '  <div class="control-group"><label class="control-label">Overtime Factor</label><div class="controls"><input type="text" name="weekending" class="input-mini"/></div></div>'
        + '  <div class="control-group"><label class="control-label">Legal Holiday Factor</label><div class="controls"><input type="text" name="weekending" class="input-mini"/></div></div>'
        + '  <div class="control-group"><label class="control-label">Special Holiday Factor</label><div class="controls"><input type="text" name="weekending" class="input-mini"/></div></div>'
        + '  <div class="control-group"><label class="control-label">Sick Days</label><div class="controls"><input type="text" name="weekending" class="input-mini"/></div></div>'
        + '  <div class="control-group"><label class="control-label">Vacation Days</label><div class="controls"><input type="text" name="weekending" class="input-mini"/></div></div>'
        + ' </fieldset>'
        + '</form></div>'
        + '<div class="modal-footer">'
        + '<button class="btn btn-success" ng-click="saveSetup()">Done</button>'
        + '<button class="btn btn-warning" ng-click="cancelSetup()">Cancel</button>'
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
        + ' <div class="pull-left">'
        + '  <button class="btn" ng-click="addRow()"><i class="icon-plus"></i> Add Row</button>'
        + '  <button class="btn" ng-click="deleteRow()"><i class="icon-minus"></i> Delete Row</button>'
        + ' </div>'
        + '  <button class="offset1 btn btn-success" ng-click="saveSSS()">Save</button>'
        + '  <button class="btn btn-warning" ng-click="cancelSSS()">Cancel</button>'
        + '</div></div>';

    $scope.socialSecurityDialogOptions = {
        backdrop: true,
        keyboard: true,
        backdropClick: false,
        dialogClass: 'modal ss-dialog',
        template: socialSecurityDialogTemplate,
        controller: 'SocialSecurityController'
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


