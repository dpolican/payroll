/**
 * Created with JetBrains WebStorm.
 * User: ewkoenw
 * Date: 9/4/13
 * Time: 7:42 AM
 * To change this template use File | Settings | File Templates.
 */

function CalendarController($scope, $timeout) {
    $scope.calendarDate = new Date();

    $scope.showDatePicker = false;

    $scope.dateOptions = {
        'show-weeks': false
    };

    $scope.showCalendar = function() {
        $timeout(function() {
            $scope.showDatePicker = true;
        });
    };


}
