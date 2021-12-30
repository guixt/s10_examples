program /s10/diagram_examples.

* kna1_detail
class kna1_detail definition inheriting from /s10/any.

  public section.

* stable fields for detail view, plus key fields
    data:
      kunnr type kna1-kunnr,
      name1 type kna1-name1,
      name2 type kna1-name2,
      land1 type kna1-land1,
      regio type kna1-regio,
      stras type kna1-stras,
      pstlz type kna1-pstlz,
      ort01 type kna1-ort01,
      telf1 type kna1-telf1,
      stcd1 type kna1-stcd1.

* database table name
    constants:
      dbtablename type string value 'KNA1'.

endclass.


class kna1_detail implementation.

endclass.

* diagrams
class diagrams_viewer definition inheriting from /s10/any.

  public section.

data:
        diagram_chosen_example type string.


endclass.


class diagrams_viewer implementation.

endclass.

*
class kna1_short definition inheriting from /s10/any.

  public section.

* table fields for list view, plus key fields
    data:
      kunnr type kna1-kunnr,
      name1 type kna1-name1,
      land1 type kna1-land1,
      pstlz type kna1-pstlz,
      ort01 type kna1-ort01.

* database table name
    constants:
      dbtablename type string value 'KNA1'.

endclass.


class kna1_short implementation.

endclass.


* kna1_manager
class kna1_manager definition inheriting from /s10/any.


  public section.

* table fields for selection
    data:
      search_name1       type kna1-name1,
      search_land1       type kna1-land1,
      search_pstlz       type kna1-pstlz,
      search_ort01       type kna1-ort01,

      search_maxrowcount type string value '100'.

    data:
      tabkna1 type table of ref to kna1_short,
      mykna1  type ref to kna1_detail.

    methods:
      list,
      on_enter_list,
      on_detail_tabkna1,

* method to build up tabkna1
      build_tabkna1
        importing
          search_name1       type kna1-name1
          search_land1       type kna1-land1
          search_pstlz       type kna1-pstlz
          search_ort01       type kna1-ort01
          search_maxrowcount type string
        exporting
          tabkna1            type table.

endclass.


class kna1_manager implementation.

* display list screen
  method list.
    s10nextscreen( 'list').
  endmethod.

* select database values and fill table tabkna1
  method build_tabkna1.

    data: condition type string.

    if search_name1 is not initial.
      if condition is not initial.
        condition = condition && | and |.
      endif.
      data: s_name1 type string.
      s_name1 = search_name1.
      translate s_name1 to upper case.
      condition = condition && |upper( NAME1 ) like '%| && s_name1 && |%'|.
    endif.

    if search_land1 is not initial.
      if condition is not initial.
        condition = condition && | and |.
      endif.
      condition = condition && |LAND1 EQ '| && search_land1 && |'|.
    endif.

    if search_ort01 is not initial.
      if condition is not initial.
        condition = condition && | and |.
      endif.
      data: s_ort01 type string.
      s_ort01 = search_ort01.
      translate s_ort01 to upper case.
      condition = condition && |upper( ORT01 ) like '%| && s_ort01 && |%'|.
    endif.

    data: maxrows type i.
    maxrows = search_maxrowcount.

* read data
    s10databaseselect( exporting condition = condition maxrows = maxrows orderby = 'kunnr' changing folder = tabkna1 ).

  endmethod.

* enter in list screen
* "build" method for table is called automatically
  method on_enter_list.


  endmethod.


* show details in list (line selection)
  method on_detail_tabkna1.

* read current table row.
    data: tabindex type i.
    tabindex = s10actionparameter( ).
    read table tabkna1 index tabindex assigning field-symbol(<row>).

* set table key and read detail attributes
    create object mykna1.
    mykna1->kunnr = <row>->kunnr.
    mykna1->s10databaseread( ).

  endmethod.
endclass.


* main class for this application
class main definition inheriting from /s10/any.

  public section.

    data: my_kna1_manager type ref to kna1_manager,
          mydiagrams_viewer type ref to diagrams_viewer.

    methods:
      logon.

endclass.

class main implementation.

* logon user
  method logon.

* set S10 license
    s10setlicense( 'Synactive GmbH demo license number=100 role=s10demo_role maxusers=10 signature=821.126.87.7' ).

*  create manager object
    create object mydiagrams_viewer.

* start list display
    mydiagrams_viewer->s10nextscreen( 'diagram_overview').

  endmethod.
endclass.
