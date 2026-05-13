package com.axon.bestpractice;

public class InvalidStateException extends RuntimeException {

    public InvalidStateException(String msg) {
        super(msg);
    }
}
