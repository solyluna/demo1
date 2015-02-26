$(function(){
  $('#load').click(function(){
    var member_name = $('#member_name').val();
    $.ajax({
      type: 'GET',
      url: 'http://localhost:4567/member/' + member_name,
      dataType: 'json',
      success: function(json) {
        $('#result').append('<ul><li>' + json.name + '</li><li>' + json.age + '</li></ul>');
      },
      error: function() {
        $('#result').append('error');
      }
    });
  });
});