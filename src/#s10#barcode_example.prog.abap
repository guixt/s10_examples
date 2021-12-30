program /s10/barcode_example.


* Barcode example
class barcode_class definition inheriting from /s10/any.

  public section.

    data:
      vbeln type vbkok-vbeln,
      posnr type vbpok-posnr_vl,
      lfimg type vbpok-lfimg,
      matnr type mara-matnr,
      maktx type makt-maktx.

    methods:

      update_delivery,

      build_maktx
        importing
          matnr type mara-matnr
        exporting
          maktx type makt-maktx.

endclass.

class barcode_class implementation.

  method build_maktx.

* read maktx
    select single maktx from makt into maktx
            where matnr = matnr and spras = sy-langu.


  endmethod.




  method update_delivery.

    data: ps_vbkok type vbkok.
    data: lw_vbpok type vbpok.
    data: pt_vbpok type table of vbpok.
    data: lt_prot type table of prott.
    data: lw_prot type  prott.

* Initialisieren
    clear ps_vbkok.

* Datenvorbelegen
    ps_vbkok-vbeln_vl        = vbeln.        " Lieferung

    ps_vbkok-vbtyp_vl        = 'J'.            " J=Lieferung
    ps_vbkok-wabuc         = 'X'.            " Warenausgang buchen
    ps_vbkok-wadat_ist     = sy-datum.       " Warenausgangsdatum


* je Line
    lw_vbpok-vbeln_vl  = vbeln.
    lw_vbpok-posnr_vl  = posnr.
    lw_vbpok-lfimg       = lfimg.
    lw_vbpok-umvkz    = 1.                   "Umrechnung: Zähler
    lw_vbpok-umvkn    = 1.                   "Umrechnung: Nenner
    append lw_vbpok to pt_vbpok. clear lw_vbpok.


* Lieferung buchen
    call function 'WS_DELIVERY_UPDATE_2'
      exporting
        vbkok_wa               = ps_vbkok
        synchron               = 'X'
        commit                 = 'X'
        delivery               = vbeln
        if_error_messages_send = 'X'
      tables
        vbpok_tab              = pt_vbpok
        prot                   = lt_prot
      exceptions
        error_message          = 4
        others                 = 2.


    if sy-subrc = 0.

      s10infomessage( 'Warenausgang wurde gebucht' ).

    endif.

* Wenn ein Fehler ausgelöst wurde, der nicht in der lt_prot steht
    if sy-subrc <> 0.

      s10errormessage(
        exporting
          msgid             =     sy-msgid
          msgno             =    sy-msgno
      ).


    endif.

    loop at lt_prot into lw_prot where msgty = 'E' or msgty = 'A'.

      data: msgno type syst_msgno.
      msgno = lw_prot-msgno.

      s10errormessage(
       exporting
         msgid             =     lw_prot-msgid
         msgno             =   msgno
           ).


    endloop.





  endmethod.


endclass.




* main class for this application
class main definition inheriting from /s10/any.

  public section.

    data:   mybarcode_class type ref to barcode_class.

    methods:
      logon.

endclass.

class main implementation.

* logon user
  method logon.

* set S10 license
    s10setlicense( 'Synactive GmbH demo license number=100 role=s10demo_role maxusers=10 signature=821.126.87.7' ).

*  create manager object
    create object mybarcode_class.

* start list display
    mybarcode_class->s10nextscreen( 'example_1').

  endmethod.
endclass.
