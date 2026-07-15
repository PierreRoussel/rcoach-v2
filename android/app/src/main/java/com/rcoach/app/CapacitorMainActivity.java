package com.rcoach.app;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class CapacitorMainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setTheme(R.style.AppTheme_NoActionBar);
    }
}
