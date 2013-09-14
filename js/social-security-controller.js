/**
 * Created with JetBrains WebStorm.
 * User: ewkoenw
 * Date: 9/5/13
 * Time: 6:45 AM
 * To change this template use File | Settings | File Templates.
 */
function SocialSecurityController($scope, dialog, SocialSecurityRepository, records) {

    $scope.records = records;

    $scope.gridOptions = {
        data: 'records',
        enableCellEditOnFocus: true,
        enableCellSelection: true,
        enableSorting: false,
//        sortInfo : { fields: ['bracket'], directions: ['asc'] },
        columnDefs: [
            {field:'bracket', displayName:'Bracket', cellFilter: 'number', width: 68, enableCellEdit: false },
            {field:'salary', displayName:'Salary', cellFilter: 'currency'},
            {field:'credit', displayName:'Credit', cellFilter: 'currency'},
            {field:'employerSS', displayName:'Employer SS', cellFilter: 'currency'},
            {field:'employerEC', displayName:'Employer EC', cellFilter: 'currency'},
            {field:'employeeSS', displayName:'Employee SS', cellFilter: 'currency'}
        ]
    };

    $scope.saveSSS = function() {
        SocialSecurityRepository.saveAll($scope.records);
        dialog.close();
    };

    $scope.cancelSSS = function () {
        dialog.close();
    };

    $scope.addRow = function() {
        var newrecord = SocialSecurityRepository.newRecord();
        newrecord.bracket = $scope.determineNextBracket();
       $scope.records.push(newrecord);
    };

    $scope.deleteRow = function() {
        var rows = $scope.records.length;
        if (rows > 0) {
            $scope.records.splice(rows - 1, 1);
        }
    }

    $scope.determineNextBracket = function () {
        var max = 0;

        for (var i = 0; i < $scope.records.length; i++)
        {
            if (max < $scope.records[i].bracket)
            {
                max = $scope.records[i].bracket;
            }
        }

        return 1 + max;
    };
}
