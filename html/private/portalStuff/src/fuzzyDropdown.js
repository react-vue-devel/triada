
(function($, Fuse) {

  function makeList2Json(iterable) {
    var locationArr = [];
    var $this;
    $.each(iterable, function() {
      $this = $(this);
      locationArr.push({
        value: $this.val(),
        text: $this.text().trim()
      });
    });
    return locationArr;
  }

  $.fn.fuzzyDropdown = function(options) {
    var _opts           = $.extend({
                            enableBrowserDefaultScroll: false
                          }, options);
    var $this           = $(this);
    var $currentSelected;
    var $mainContainer  = $(_opts.mainContainer);
    var $currentValCont = $($mainContainer.children('div')[0]);
    var $currentValSpan = $currentValCont.children('span:first');
    var $arrowSpan      = $($currentValCont.children('span')[1]);
    var $dropdownCont   = $($mainContainer.children('div')[1]);
    var $searchInput    = $dropdownCont.children('input:first');
    var $dropdownUL     = $dropdownCont.children('ul:first');
    var $lis;
    var list            = $this.children('option');
    var locations       = makeList2Json(list);
    var noResultsId     = +new Date() + '-no-results-found';
    var html;
    var fuse            = new Fuse(locations, {
                            keys: ['text'],
                            id: 'value',
                            location: _opts.location || 0,
                            threshold: _opts.threshold || 0.61,
                            distance: _opts.distance || 100,
                            maxPatternLength: _opts.maxPatternLength || 64,
                            caseSensitive: _opts.caseSensitive || false,
                            includeScore: _opts.includeScore || false,
                            shouldSort: _opts.shouldSort || true
                          });

    //if the select box has no options, just return and do nothing
    if (!$this.children('option').length) return;

    console.debug('fuzzyDropdown: threshold is ' + _opts.threshold);
    //hide the select box
    $this.hide();

    //show our container if hidden
    if ($(_opts.mainContainer + ':hidden').length) {
      $mainContainer.show();
    }

    //get current selected option
    $currentSelected = $this.children('option[selected]');
    $currentSelected = $currentSelected.length ? $currentSelected : $this.children('option:first');

    //setup current selected
    $currentValSpan.attr('data-val', $currentSelected.val());
    $currentValSpan.text($currentSelected.text());

    //add search image to search bar
    //todo

    //populate the search list
    for (var i = 0; i < list.length; i++) {
      html = '<li data-val="' + list[i].value + '">' + list[i].text + '</li>';
      $dropdownUL.append(html);
    }

    var Patients = Parse.Object.extend("Patients");
    var PatientsQuery = new Parse.Query(Patients);

    //query conditions
    PatientsQuery.equalTo("pharmacyId", Parse.User.current().id);

    PatientsQuery.find({
        success: function(results){
            //$("#patient_info_table_body").empty();
            
            for (var i = 0; i < results.length; i++) { 
                // alert(JSON.stringify(results[i].id));
                var name = results[i].get("name");
                var objectId = results[i].id;
                var createdAt = results[i].createdAt;
                var updatedAt = results[i].updatedAt;
                var email = results[i].get("email");
                var address = results[i].get("address");
                var telephone = results[i].get("telephone");

                var html = '<li data-val="' + objectId + '">' +' '+ name + ' ' + address + ' '+ telephone + objectId +'</li>';

                //html = '<li data-val="' + list[i].value + '">' + list[i].text + '</li>';
                $dropdownUL.append(html);
            }
        },
        error: function(error){
            alert("Error: " + error.code + " " + error.message);
        }
    });



    //add the no results element
    $dropdownUL.append('<li id="' + noResultsId + '" style="display:none;">No patients found from your search, either refine search or enter patient info into the form and submit.</li>');

    //store lis for future use
    $lis = $dropdownUL.children('li');

    //add handler for search function
    $searchInput.keyup(function(evt) {
      var $this = $(this);
      var val = $this.val();
      var results;
      if (val === '') {
        $lis.css('display', 'list-item');
        $('#' + noResultsId).css('display', 'none');
      }
      else {
        results = fuse.search(val);
        if (results.length) {
          $lis.css('display', 'none');
          $lis.each(function() {
            var $this = $(this);
            for (var i = 0; i < results.length; i++) {
              if ($this.attr('data-val') === '' + results[i]) {
                $this.css('display', 'list-item');
              }
            }
          });
        }
        else {
          $lis.css('display', 'none');
          $('#' + noResultsId).css('display', 'list-item');
        }
      }
    });

    //removes the selectedClass from li item that has it
    function clearSelectedClass() {
      $dropdownUL.children('.' + _opts.selectedClass).removeClass(_opts.selectedClass);
    }

    //add toggle dropdown function
    $currentValCont.click(function(evt) {
      evt.preventDefault();
      evt.stopPropagation();
      $arrowSpan.toggleClass(_opts.arrowUpClass);
      $dropdownCont.slideToggle(100);
      if ($dropdownCont.is(':visible')) $searchInput.focus().select();
      clearSelectedClass();
    });

    //add handlers for click on li
    $dropdownCont.on('click', 'li', function(evt) {
      var $self = $(this);
      $currentValSpan.attr('data-val', $self.attr('data-val'));
      $currentValSpan.text($self.text());
      $this.find('option:selected').prop('selected', false);
      $this.children('option[value=' + $self.attr('data-val') + ']').prop('selected', true).change();
    });

    //close dropdown on click anywhere on document body
    $('body').click(function() {
      if ($dropdownCont.is(':visible') && !$searchInput.is(':focus')) $currentValCont.click();
    });

    //add up, down arrow keys functionality
    //move to first visible item when down arrow is pressed in the search box
    $searchInput.keydown(function(e) {
      e.stopPropagation();
      clearSelectedClass();
      //if no results, return
      if ($dropdownUL.children(':visible:first').get(0) === $('#' + noResultsId).get(0)) {
        clearSelectedClass();
        return;
      }
      if (e.keyCode === 40) {
        $dropdownUL.children(':visible:first').addClass(_opts.selectedClass);
        $searchInput.blur();
      }
    });

    //arrows and enter handling on the list items
    $dropdownUL.on('keydown', 'li', function(e) {
      var $this = $(this);
      var isFirst = $dropdownUL.children(':visible:first').get(0) === $this.get(0);
      var isLast = $dropdownUL.children(':visible:last').get(0) === $this.get(0);
      var $next = $this.next();
      var $prev = $this.prev();

      e.preventDefault();
      e.stopPropagation();

      //if it's the first option and up arrow is pressed, goto search input
      if (isFirst && e.keyCode === 38) {
        $this.removeClass(_opts.selectedClass);
        $searchInput.focus().select();
        return;
      }

      //if it'the last option and the down arrow is pressed, go back to first item
      if (isLast && e.keyCode === 40) {
        //ignore down arrow on last item
        return;
      }

      //if arrow down then find the next visible item and move down to it
      if (e.keyCode === 40) {
        $this.removeClass(_opts.selectedClass);
        while (!$next.is(':visible')) {
          $next = $next.next();
        }
        $next.addClass(_opts.selectedClass);
        return;
      }

      //if arrow up then find the prev visible item and move up to it
      if (e.keyCode === 38) {
        $this.removeClass(_opts.selectedClass);
        while (!$prev.is(':visible')) {
          $prev = $prev.prev();
        }
        $prev.addClass(_opts.selectedClass);
        return;
      }

      //trigger click on enter
      if (e.keyCode === 13) $this.click();

    });

    //if the dropdown list is visible, proxy all arrow up, down and enter key presses there
    $('body').on('keydown', function(e) {
      var evt;
      if ($dropdownCont.is(':visible') && (e.keyCode === 38 || e.keyCode === 40 || e.keyCode === 13)) {
        //disable browser scroll on arrow up and down if flag disabled
        if (!_opts.enableBrowserDefaultScroll) e.preventDefault();
        e.stopPropagation();
        //prepare event to trigger on item
        evt = $.Event('keydown');
        evt.keyCode = e.keyCode;
        $dropdownUL.children('.' + _opts.selectedClass).trigger(evt);
      }
    });
  };
})(window.jQuery, window.Fuse);
